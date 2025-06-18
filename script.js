(() => {
  const textInput = document.getElementById('textInput');
  const fgColor = document.getElementById('fgColor');
  const bgColor = document.getElementById('bgColor');
  const generateBtn = document.getElementById('generateBtn');
  const qrCodeContainer = document.getElementById('qrCode');
  const downloadBtn = document.getElementById('downloadBtn');
  const printBtn = document.getElementById('printBtn');
  const sizeSelect = document.getElementById('sizeSelect');

  textInput.addEventListener('input', () => {
    generateBtn.disabled = !textInput.value.trim();
  });

  async function generateQRCode() {
    const text = textInput.value.trim();
    if (!text) return;

    qrCodeContainer.innerHTML = '';
    downloadBtn.style.display = 'none';
    printBtn.style.display = 'none';

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

      qrCodeContainer.appendChild(canvas);
      downloadBtn.style.display = 'inline-block';
      printBtn.style.display = 'inline-block';

    } catch (err) {
      qrCodeContainer.textContent = 'Ошибка генерации QR-кода.';
      console.error(err);
      downloadBtn.style.display = 'none';
      printBtn.style.display = 'none';
    }
  }

  generateBtn.addEventListener('click', generateQRCode);

  let pressTimer = null;

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

  downloadBtn.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => {
      const canvas = qrCodeContainer.querySelector('canvas');
      if (!canvas) return;

      const dataUrl = canvas.toDataURL('image/png');
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <html>
            <head><title>QR-код для скачивания</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f4f8;">
              <img src="${dataUrl}" alt="QR-код" style="max-width:90%; max-height:90%; border-radius:16px;"/>
              <p style="text-align:center; font-family:sans-serif; margin-top:10px;">
                Правый клик по изображению и "Сохранить как..." для скачивания.
              </p>
            </body>
          </html>
        `);
        newTab.document.close();
      }
    }, 700);
  });

  downloadBtn.addEventListener('mouseup', () => {
    clearTimeout(pressTimer);
  });

  downloadBtn.addEventListener('mouseleave', () => {
    clearTimeout(pressTimer);
  });

  printBtn.addEventListener('click', () => {
    const canvas = qrCodeContainer.querySelector('canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Печать QR-кода</title>
            <style>
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f0f4f8;
              }
              img {
                max-width: 90%;
                max-height: 90%;
                border-radius: 16px;
                box-shadow: 0 12px 24px rgba(0,0,0,0.2);
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="QR-код" />
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 100);
              }
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  });
})();