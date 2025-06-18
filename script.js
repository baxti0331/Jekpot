(() => {
  const textInput = document.getElementById('textInput');
  const fgColor = document.getElementById('fgColor');
  const bgColor = document.getElementById('bgColor');
  const generateBtn = document.getElementById('generateBtn');
  const qrCodeContainer = document.getElementById('qrCode');
  const downloadBtn = document.getElementById('downloadBtn');
  const sizeSelect = document.getElementById('sizeSelect');
  const logoFile = document.getElementById('logoFile');

  let logoImage = null;

  // Включаем кнопку генерации, если есть текст
  textInput.addEventListener('input', () => {
    generateBtn.disabled = !textInput.value.trim();
  });

  // Загружаем логотип из файла
  logoFile.addEventListener('change', () => {
    const file = logoFile.files[0];
    if (!file) {
      logoImage = null;
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение.');
      logoFile.value = '';
      logoImage = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      logoImage = new Image();
      logoImage.src = reader.result;
      // Подгружаем логотип, чтобы быть уверенным, что он готов для отрисовки
      logoImage.onload = () => {};
    };
    reader.readAsDataURL(file);
  });

  async function generateQRCode() {
    const text = textInput.value.trim();
    if (!text) return;

    qrCodeContainer.innerHTML = '';
    downloadBtn.style.display = 'none';

    try {
      const size = parseInt(sizeSelect.value, 10) || 256;
      const opts = {
        color: {
          dark: fgColor.value,
          light: bgColor.value,
        },
        margin: 2,
        width: size,
      };

      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, text, opts);

      if (logoImage) {
        const ctx = canvas.getContext('2d');
        const logoSize = size * 0.2;
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;

        // Нарисовать белый круг под логотипом для контраста
        ctx.fillStyle = bgColor.value;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 1.8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.drawImage(logoImage, x, y, logoSize, logoSize);
      }

      qrCodeContainer.appendChild(canvas);
      downloadBtn.style.display = 'block';

    } catch (err) {
      qrCodeContainer.textContent = 'Ошибка при генерации QR-кода.';
      console.error(err);
      downloadBtn.style.display = 'none';
    }
  }

  generateBtn.addEventListener('click', generateQRCode);

  downloadBtn.addEventListener('click', () => {
    const canvas = qrCodeContainer.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  });
})();