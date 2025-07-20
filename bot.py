import asyncio
import os
import aiosqlite
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder, CommandHandler, ContextTypes,
    CallbackQueryHandler, ConversationHandler, MessageHandler, filters
)

TOKEN = os.getenv("TELEGRAM_TOKEN")
PORT = int(os.getenv("PORT", "8443"))
RENDER_HOST = os.getenv("RENDER_EXTERNAL_HOSTNAME")
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))

if not TOKEN or not RENDER_HOST:
    raise ValueError("Нужно указать TELEGRAM_TOKEN и RENDER_EXTERNAL_HOSTNAME!")
if not ADMIN_ID:
    raise ValueError("Нужно указать ADMIN_ID!")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "posts.db")

WAITING_POST = 1
WAITING_TARGET = 2

# ИНИЦИАЛИЗАЦИЯ БД
async def init_db():
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                content TEXT,
                file_id TEXT,
                caption TEXT
            );
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS targets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target TEXT UNIQUE
            );
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        """)
        await db.commit()

# РАБОТА С БД
async def add_post(post_type, content=None, file_id=None, caption=None):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("""
            INSERT INTO posts (type, content, file_id, caption)
            VALUES (?, ?, ?, ?)
        """, (post_type, content, file_id, caption))
        await db.commit()

async def get_posts():
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute("SELECT * FROM posts")
        return await cursor.fetchall()

async def clear_posts():
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("DELETE FROM posts")
        await db.commit()

async def add_target(target):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("INSERT OR IGNORE INTO targets (target) VALUES (?)", (target,))
        await db.commit()

async def get_targets():
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute("SELECT target FROM targets")
        return [row[0] for row in await cursor.fetchall()]

async def delete_target(target):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("DELETE FROM targets WHERE target = ?", (target,))
        await db.commit()

async def set_repeat_interval(interval):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("""
            INSERT INTO config (key, value) VALUES ('interval', ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value
        """, (str(interval),))
        await db.commit()

async def get_repeat_interval():
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute("SELECT value FROM config WHERE key='interval'")
        row = await cursor.fetchone()
        return int(row[0]) if row else 0

# АВТОПОСТИНГ
async def send_next_post(app):
    posts = await get_posts()
    targets = await get_targets()

    if not posts:
        print("[INFO] Очередь пустая.")
        return
    if not targets:
        print("[INFO] Нет каналов/групп.")
        return

    for post in posts:
        for chat_id in targets:
            try:
                if post[1] == "text":
                    await app.bot.send_message(chat_id, post[2])
                elif post[1] == "photo":
                    await app.bot.send_photo(chat_id, post[3], caption=post[4])
                elif post[1] == "video":
                    await app.bot.send_video(chat_id, post[3], caption=post[4])
                elif post[1] == "document":
                    await app.bot.send_document(chat_id, post[3], caption=post[4])
            except Exception as e:
                print(f"[ERROR] Не удалось отправить в {chat_id}: {e}")

async def scheduler(app):
    while True:
        interval = await get_repeat_interval()
        if interval > 0:
            await send_next_post(app)
            await asyncio.sleep(interval * 60)
        else:
            await asyncio.sleep(5)

# ХЕНДЛЕРЫ
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_ID:
        await update.message.reply_animation(
            animation="https://system365.pro/wp-content/uploads/2020/11/funkygoose-13.gif",
            caption="🔒 Нет доступа. Пиши @baxti_pm если нужен доступ."
        )
        return ConversationHandler.END
    await show_main_menu(update.message)
    return ConversationHandler.END

async def show_main_menu(message):
    keyboard = [
        [InlineKeyboardButton("➕ Добавить пост", callback_data="add_post")],
        [InlineKeyboardButton("📋 Очередь", callback_data="show_queue")],
        [InlineKeyboardButton("🗑 Очистить очередь", callback_data="clear_queue")],
        [InlineKeyboardButton("➕ Добавить канал/группу", callback_data="add_target")],
        [InlineKeyboardButton("📋 Каналы/группы", callback_data="show_targets")],
        [InlineKeyboardButton("⏱ 1 мин", callback_data="interval_1"),
         InlineKeyboardButton("⏱ 5 мин", callback_data="interval_5")],
        [InlineKeyboardButton("⏱ 10 мин", callback_data="interval_10"),
         InlineKeyboardButton("⏱ 20 мин", callback_data="interval_20")],
        [InlineKeyboardButton("🚫 Остановить", callback_data="interval_0")]
    ]
    await message.reply_text("Привет! Управляй автопостингом:", reply_markup=InlineKeyboardMarkup(keyboard))

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_ID:
        await update.callback_query.answer("🔒 Нет доступа.", show_alert=True)
        return ConversationHandler.END

    query = update.callback_query
    await query.answer()

    if query.data == "add_post":
        await query.message.reply_text("Отправьте пост:")
        return WAITING_POST

    elif query.data == "show_queue":
        posts = await get_posts()
        if not posts:
            await query.message.edit_text("Очередь пуста.")
            await show_main_menu(query.message)
            return ConversationHandler.END
        text = "Очередь постов:\n"
        for idx, post in enumerate(posts):
            text += f"{idx+1}. {post[1]}"
            if post[1] == "text":
                text += f": {post[2][:30]}"
            if post[4]:
                text += f" ({post[4][:30]})"
            text += "\n"
        await query.message.edit_text(text)
        await show_main_menu(query.message)
        return ConversationHandler.END

    elif query.data == "clear_queue":
        await clear_posts()
        await query.message.edit_text("Очередь очищена.")
        await show_main_menu(query.message)
        return ConversationHandler.END

    elif query.data == "add_target":
        await query.message.reply_text("Отправьте ID канала/группы или @username:")
        return WAITING_TARGET

    elif query.data == "show_targets":
        targets = await get_targets()
        if not targets:
            await query.message.edit_text("Список пуст.")
            await show_main_menu(query.message)
            return ConversationHandler.END
        text = "Каналы/группы:\n"
        buttons = []
        for t in targets:
            text += f"- {t}\n"
            buttons.append([InlineKeyboardButton(f"❌ {t}", callback_data=f"delete|{t}")])
        buttons.append([InlineKeyboardButton("↩ Назад", callback_data="back")])
        await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(buttons))
        return ConversationHandler.END

    elif query.data.startswith("delete|"):
        target = query.data.split("|", 1)[1]
        await delete_target(target)
        await query.message.edit_text(f"{target} удалён.")
        await show_main_menu(query.message)
        return ConversationHandler.END

    elif query.data.startswith("interval_"):
        interval = int(query.data.split("_")[1])
        await set_repeat_interval(interval)
        msg = "Автопостинг остановлен." if interval == 0 else f"Автопостинг каждые {interval} минут."
        await query.message.edit_text(msg)
        await show_main_menu(query.message)
        return ConversationHandler.END

    elif query.data == "back":
        await show_main_menu(query.message)
        return ConversationHandler.END

    return ConversationHandler.END

async def post_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_ID:
        return ConversationHandler.END

    if update.message.text:
        await add_post("text", content=update.message.text)
    elif update.message.photo:
        file_id = update.message.photo[-1].file_id
        await add_post("photo", file_id=file_id, caption=update.message.caption or "")
    elif update.message.video:
        file_id = update.message.video.file_id
        await add_post("video", file_id=file_id, caption=update.message.caption or "")
    elif update.message.document:
        file_id = update.message.document.file_id
        await add_post("document", file_id=file_id, caption=update.message.caption or "")
    else:
        await update.message.reply_text("❗ Неподдерживаемый тип.")
        await show_main_menu(update.message)
        return ConversationHandler.END

    await update.message.reply_text("Пост добавлен.")
    await show_main_menu(update.message)
    return ConversationHandler.END

async def target_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_ID:
        return ConversationHandler.END

    target = update.message.text.strip()
    await add_target(target)
    await update.message.reply_text(f"{target} добавлен.")
    await show_main_menu(update.message)
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Операция отменена.")
    await show_main_menu(update.message)
    return ConversationHandler.END

# ЗАПУСК
if __name__ == "__main__":
    app = ApplicationBuilder().token(TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CallbackQueryHandler(button_handler),
                      CommandHandler("start", start)],
        states={
            WAITING_POST: [MessageHandler(filters.ALL & ~filters.COMMAND, post_input)],
            WAITING_TARGET: [MessageHandler(filters.TEXT & ~filters.COMMAND, target_input)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    app.add_handler(conv_handler)

    async def on_startup(app):
        await init_db()
        print("[INFO] Бот и БД запущены.")
        asyncio.create_task(scheduler(app))

    app.post_init = on_startup

    WEBHOOK_PATH = f"/{TOKEN}"
    WEBHOOK_URL = f"https://{RENDER_HOST}/{TOKEN}"

    app.run_webhook(
        listen="0.0.0.0",
        port=PORT,
        url_path=TOKEN,
        webhook_url=WEBHOOK_URL
    )
