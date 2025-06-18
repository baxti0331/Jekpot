(() => {
  // QR-код элементы
  const textInput = document.getElementById('textInput');
  const fgColor = document.getElementById('fgColor');
  const bgColor = document.getElementById('bgColor');
  const sizeSelect = document.getElementById('sizeSelect');
  const logoFile = document.getElementById('logoFile');
  const genBtn = document.getElementById('generateBtn');
  const qrCodeContainer = document.getElementById('qrCode');
  const dlBtn = document.getElementById('downloadBtn');
  const prnBtn = document.getElementById('printBtn');
  const openBarBtn = document.getElementById('openBarcodeBtn');

  let logoImage = null;

  textInput.addEventListener('input', () => {
    genBtn.disabled = !textInput.value.trim();
  });

  logoFile.addEventListener('change', () => {
    const file = logoFile.files[0];
    if (!file) { logoImage = null; return; }
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
    };
    reader.readAsDataURL(file);
  });

  async function generateQR() {
    const txt = textInput.value.trim();
    if (!txt) return;
    qrCodeContainer.innerHTML = '';
    dlBtn.style.display = prnBtn.style.display = 'none';

    try {
      const size = parseInt(sizeSelect.value);
      const opts = { color:{dark:fgColor.value, light:bgColor.value}, margin:2, width:size };
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, txt, opts);

      if (logoImage) {
        const ctx = canvas.getContext('2d');
        const ls = size * 0.2;
        const x = (size - ls) / 2;
        const y = x;
        ctx.fillStyle = bgColor.value;
        ctx.beginPath();
        ctx.arc(size/2, size/2, ls/1.8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.drawImage(logoImage, x, y, ls, ls);
      }

      qrCodeContainer.appendChild(canvas);
      dlBtn.style.display = prnBtn.style.display = 'inline-block';
    } catch (e) {
      qrCodeContainer.textContent = 'Ошибка генерации QR-кода.';
      dlBtn.style.display = prnBtn.style.display = 'none';
      console.error(e);
    }
  }

  genBtn.addEventListener('click', generateQR);

  dlBtn.addEventListener('click', () => {
    const canvas = qrCodeContainer.querySelector('canvas');
    if (!canvas) return;
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'qr-code.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  });

  prnBtn.addEventListener('click', () => {
    const canvas = qrCodeContainer.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Печать QR</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;}
      img{max-width:90%;}</style></head><body>
      <img src="${dataUrl}" onload="window.print();window.close();"/>
      </body></html>`);
    w.document.close();
  });

  // Штрихкод-панель элементы
  const slide = document.getElementById('barcodeSlide');
  const closeBtn = document.getElementById('closeBarcodeBtn');
  const eanInput = document.getElementById('eanInput');
  const genBarBtn = document.getElementById('genBarcodeBtn');
  const bcContainer = document.getElementById('barcodeContainer');
  const bcDl = document.getElementById('barcodeDownloadBtn');
  const bcPrn = document.getElementById('barcodePrintBtn');

  openBarBtn.addEventListener('click', () => slide.classList.add('open'));
  closeBtn.addEventListener('click', () => slide.classList.remove('open'));

  eanInput.addEventListener('input', () => {
    genBarBtn.disabled = !/^\d{12}$/.test(eanInput.value);
  });

  genBarBtn.addEventListener('click', () => {
    bcContainer.innerHTML = '';
    bcDl.style.display = bcPrn.style.display = 'none';
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, eanInput.value, { format: 'ean13', displayValue: true, width: 2, height: 100 });
      bcContainer.appendChild(svg);
      bcDl.style.display = bcPrn.style.display = 'inline-block';
    } catch (e) {
      bcContainer.textContent = 'Ошибка штрихкода';
      console.error(e);
    }
  });

  bcDl.addEventListener('click', () => {
    const svg = bcContainer.querySelector('svg');
    if (!svg) return;
    const data = '<?xml version="1.0"?>' + new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'barcode.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  bcPrn.addEventListener('click', () => {
    const svg = bcContainer.querySelector('svg');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Печать штрихкода</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;}
      svg{max-width:90%;}</style></head><body>${data}
      <script>window.onload=()=>{window.print();window.close();};</script>
      </body></html>`);
    w.document.close();
  });
})();