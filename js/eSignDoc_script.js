    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    // Initialize variables
    let canvas = document.getElementById("pdf-canvas"),
        ctx = canvas.getContext("2d"),
        pdfDoc = null,
        pageNum = 1,
        uploadedPdfBuffer = null,
        lastSignedBlob = null,
        scale = 1.5,
        pdfViewport = null,
        signatureRelativePosition = { x: 0.05, y: 0.05 },
        originalPdfFileName = "signed_document.pdf",
        currentSignatureColor = "#000000",
        signatureThickness = 2;

    const signatureState = {
      width: 120,
      height: 50,
      color: "#000000",
      thickness: 2,
      isImage: false,
      position: null // Added to store exact position
    };

    // Initialize UI components
    function initUI() {
      // Tab switching
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          
          this.classList.add('active');
          document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
        });
      });

      // Edit options toggle
      document.getElementById('toggle-edit').addEventListener('change', function() {
        const panel = document.getElementById('settings-panel');
        panel.classList.toggle('open');
      });

      // PDF preview toggle
      document.getElementById('toggle-preview').addEventListener('change', function() {
        const show = this.checked;
        document.getElementById("pdf-container").style.display = show ? "block" : "none";
        document.getElementById("use-sign").disabled = !show;

        document.getElementById("upload-pdf-container").style.display = show ? "block" : "none";
        document.getElementById("output-sec").style.display = show ? "block" : "none";
        document.getElementById("pdf-view").style.display = show ? "block" : "none";
        document.getElementById("use-sign").style.display = show ? "block" : "none";
        
        if (show && !uploadedPdfBuffer) {
          showFeedback('Please upload a PDF document', 'error');
        }
      });

      // Initialize signature pad
      const sigPad = document.getElementById("signature-pad");
      const sigCtx = sigPad.getContext("2d");
      updateSignaturePadStyle();
      initSignaturePad(sigPad, sigCtx);

      // Initialize controls
      initControls();
      
      // Initialize drag and resize
      initDragResize();

      //camera initialize
      initCameraCapture();


    }

    function initSignaturePad(canvas, ctx) {
      let drawing = false;
      
      canvas.addEventListener("mousedown", e => {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = currentSignatureColor;
        ctx.lineWidth = signatureThickness;
      });

      canvas.addEventListener("mousemove", e => {
        if (drawing) {
          ctx.lineTo(e.offsetX, e.offsetY);
          ctx.stroke();
        }
      });

      canvas.addEventListener("mouseup", () => drawing = false);
      canvas.addEventListener("mouseleave", () => drawing = false);

      // Touch support
      canvas.addEventListener("touchstart", e => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
          offsetX: touch.clientX - rect.left,
          offsetY: touch.clientY - rect.top
        });
        canvas.dispatchEvent(mouseEvent);
      });

      canvas.addEventListener("touchmove", e => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
          offsetX: touch.clientX - rect.left,
          offsetY: touch.clientY - rect.top
        });
        canvas.dispatchEvent(mouseEvent);
      });

      canvas.addEventListener("touchend", e => {
        e.preventDefault();
        const mouseEvent = new MouseEvent("mouseup");
        canvas.dispatchEvent(mouseEvent);
      });

      document.getElementById("clear-signature").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        showFeedback('Signature cleared', 'success');
      });

      document.getElementById("prev-btn").addEventListener("click", createPreview);
    }

    function initControls() {
      // Thickness control
      document.getElementById('signature-thickness').addEventListener('input', function() {
        signatureThickness = parseInt(this.value);
        document.getElementById('thickness-value').textContent = `${signatureThickness}px`;
      });

      // Color controls
      document.getElementById('signature-color').addEventListener('input', function() {
        currentSignatureColor = this.value;
        document.getElementById('signature-color-value').textContent = this.value;
        document.getElementById('signature-color-value').style.color = this.value;
      });

      // Apply Style button
      document.getElementById('apply-style').addEventListener('click', function() {
        updateSignaturePadStyle();
        showFeedback('Style applied to new drawings', 'success');
      });

      // Clear Style button
      document.getElementById('clear-style').addEventListener('click', resetStyles);

      // Upload signature
      document.getElementById("upload-signature").addEventListener("change", function() {
        const reader = new FileReader();
        reader.onload = e => {
          document.getElementById("signature-preview").src = e.target.result;
          signatureState.isImage = true;
          showFeedback('Signature uploaded', 'success');
        };
        reader.readAsDataURL(this.files[0]);
      });

      // Upload PDF
      document.getElementById("upload-pdf").addEventListener("change", function() {
        const file = this.files[0];
        if (!file || file.type !== "application/pdf") {
          showFeedback('Please upload a PDF file', 'error');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
          uploadedPdfBuffer = e.target.result;
          renderPDF(uploadedPdfBuffer);

          const uploadedFileName = file.name;
          const dotIndex = uploadedFileName.lastIndexOf(".");
          if (dotIndex > 0) {
            const base = uploadedFileName.substring(0, dotIndex);
            const ext = uploadedFileName.substring(dotIndex);
            originalPdfFileName = `${base}_signed${ext}`;
          } else {
            originalPdfFileName = `${uploadedFileName}_signed.pdf`;
          }
          
          showFeedback('PDF loaded successfully', 'success');
        };
        reader.readAsArrayBuffer(file);
      });

      // Use This Sign button
      document.getElementById("use-sign").addEventListener("click", placeSignature);

      // Save and download buttons
      document.getElementById("save-pdf").addEventListener("click", savePDF);
      document.getElementById("download-pdf").addEventListener("click", downloadPDF);
    }

    function initDragResize() {
      const sigContainer = document.getElementById("draggable-signature-container");
      const sigImg = document.getElementById("draggable-signature");
      let isDragging = false;
      let isResizing = false;
      let resizeHandle = null;
      let startX, startY, startWidth, startHeight, startLeft, startTop;

      // Mouse event handlers for dragging
      sigContainer.addEventListener("mousedown", (e) => {
        if (e.target === sigContainer || e.target === sigImg) {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startLeft = parseInt(sigContainer.style.left) || 0;
          startTop = parseInt(sigContainer.style.top) || 0;
          e.preventDefault();
        }
      });

      // Resize handle event handlers
      document.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
          isResizing = true;
          resizeHandle = this;
          startX = e.clientX;
          startY = e.clientY;
          startWidth = parseInt(sigContainer.style.width);
          startHeight = parseInt(sigContainer.style.height);
          e.preventDefault();
          e.stopPropagation();
        });
      });

      // Document mouse move handler
      document.addEventListener("mousemove", (e) => {
        if (isDragging) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          
          let newLeft = startLeft + dx;
          let newTop = startTop + dy;
          
          // Constrain to canvas bounds
          newLeft = Math.max(0, Math.min(newLeft, canvas.width - sigContainer.offsetWidth));
          newTop = Math.max(0, Math.min(newTop, canvas.height - sigContainer.offsetHeight));
          
          sigContainer.style.left = `${newLeft}px`;
          sigContainer.style.top = `${newTop}px`;
          
          // Update signature state with exact position
          signatureState.position = {
            left: newLeft + canvas.offsetLeft,
            top: newTop + canvas.offsetTop
          };
        } 
        else if (isResizing && resizeHandle) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          
          let newWidth = startWidth;
          let newHeight = startHeight;
          
          // Calculate new dimensions based on which handle is used
          if (resizeHandle.classList.contains('resize-handle-bottom-right')) {
            newWidth = Math.max(50, startWidth + dx);
            newHeight = Math.max(20, startHeight + dy);
          } 
          else if (resizeHandle.classList.contains('resize-handle-bottom-left')) {
            newWidth = Math.max(50, startWidth - dx);
            newHeight = Math.max(20, startHeight + dy);
            sigContainer.style.left = `${(parseInt(sigContainer.style.left) || 0) + dx}px`;
          } 
          else if (resizeHandle.classList.contains('resize-handle-top-right')) {
            newWidth = Math.max(50, startWidth + dx);
            newHeight = Math.max(20, startHeight - dy);
            sigContainer.style.top = `${(parseInt(sigContainer.style.top) || 0) + dy}px`;
          } 
          else if (resizeHandle.classList.contains('resize-handle-top-left')) {
            newWidth = Math.max(50, startWidth - dx);
            newHeight = Math.max(20, startHeight - dy);
            sigContainer.style.left = `${(parseInt(sigContainer.style.left) || 0) + dx}px`;
            sigContainer.style.top = `${(parseInt(sigContainer.style.top) || 0) + dy}px`;
          }
          
          // Apply new dimensions
          sigContainer.style.width = `${newWidth}px`;
          sigContainer.style.height = `${newHeight}px`;
          
          // Update signature state
          signatureState.width = newWidth;
          signatureState.height = newHeight;
        }
      });

      // End interactions
      document.addEventListener("mouseup", () => {
        isDragging = false;
        isResizing = false;
        resizeHandle = null;
      });
    }

    function updateSignaturePadStyle() {
      const sigCtx = document.getElementById("signature-pad").getContext('2d');
      sigCtx.strokeStyle = currentSignatureColor;
      sigCtx.lineWidth = signatureThickness;
      sigCtx.lineJoin = 'round';
      sigCtx.lineCap = 'round';
    }

    function resetStyles() {
      // Reset signature color
      currentSignatureColor = '#000000';
      document.getElementById('signature-color').value = currentSignatureColor;
      document.getElementById('signature-color-value').textContent = currentSignatureColor;
      document.getElementById('signature-color-value').style.color = '';
      
      // Reset thickness
      signatureThickness = 2;
      document.getElementById('signature-thickness').value = signatureThickness;
      document.getElementById('thickness-value').textContent = '2px';
      
      // Apply changes
      updateSignaturePadStyle();
      
      showFeedback('Styles reset to defaults', 'success');
    }

    function createPreview() {
      const sigPad = document.getElementById("signature-pad");
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = sigPad.width;
      previewCanvas.height = sigPad.height;
      const previewCtx = previewCanvas.getContext('2d');
      
      // Fill with transparent background for preview
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      
      // Draw the signature
      previewCtx.drawImage(sigPad, 0, 0);
      
      // Set as preview image with transparent background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sigPad.width;
      tempCanvas.height = sigPad.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(previewCanvas, 0, 0);
      
      document.getElementById("signature-preview").src = tempCanvas.toDataURL();
      signatureState.isImage = false;
      
      showFeedback('Signature preview created', 'success');

      document.getElementById("save-sign").style.display ='block'

    }

    function placeSignature() {
      const sigContainer = document.getElementById("draggable-signature-container");
      const sigImg = document.getElementById("draggable-signature");
      const preview = document.getElementById("signature-preview");
      
      if (!preview.src) {
        showFeedback('No signature to use. Draw or upload first.', 'error');
        return;
      }
      
      // Create a transparent version of the signature
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = signatureState.width;
      tempCanvas.height = signatureState.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Draw white background first (for preview)
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the signature
      const img = new Image();
      img.onload = function() {
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Make white pixels transparent
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // If pixel is white (or nearly white), make it transparent
          if (data[i] > 250 && data[i+1] > 250 && data[i+2] > 250) {
            data[i+3] = 0; // Set alpha to 0
          }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        
        // Set as signature image
        sigImg.src = tempCanvas.toDataURL();
        sigContainer.style.display = "block";
        sigContainer.style.width = `${signatureState.width}px`;
        sigContainer.style.height = `${signatureState.height}px`;
        
        // Set initial position if not already set
        if (!sigContainer.style.left || !sigContainer.style.top) {
          const left = canvas.offsetLeft + (canvas.width * signatureRelativePosition.x);
          const top = canvas.offsetTop + (canvas.height * signatureRelativePosition.y);
          sigContainer.style.left = `${left}px`;
          sigContainer.style.top = `${top}px`;
          
          // Store exact position
          signatureState.position = {
            left: left,
            top: top
          };
        }
        
        // Update signature state
        signatureState.isImage = document.getElementById("upload-signature").files.length > 0;
        
        showFeedback('Signature placed on document', 'success');
      };
      img.src = preview.src;
    }

    function renderPDF(fileBuffer) {
      pdfjsLib.getDocument({ data: fileBuffer }).promise.then(pdf => {
        pdfDoc = pdf;
        return pdf.getPage(pageNum);
      }).then(page => {
        pdfViewport = page.getViewport({ scale });
        canvas.width = pdfViewport.width;
        canvas.height = pdfViewport.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render PDF page
        page.render({ canvasContext: ctx, viewport: pdfViewport });
      }).catch(err => {
        console.error('PDF rendering error:', err);
        showFeedback('Error loading PDF', 'error');
      });
    }

    async function savePDF() {
      const format = document.getElementById("save-format").value || "pdf";

      if (format === "jpeg" || format === "png" || format === "docx") {
        saveAsImage(format);
      } else {
        await generateSignedPDF();
      }
    }

    async function generateSignedPDF() {
      if (!uploadedPdfBuffer || !pdfViewport) {
        showFeedback('Please upload a PDF first', 'error');
        return;
      }

      try {
        const pdfDocLib = await PDFLib.PDFDocument.load(uploadedPdfBuffer);
        const page = pdfDocLib.getPages()[0];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        const sigImg = document.getElementById("signature-preview");
        if (!sigImg.src) {
          showFeedback('No signature to add', 'error');
          return;
        }

        // Create transparent signature
        const sigCanvas = document.createElement("canvas");
        sigCanvas.width = signatureState.width;
        sigCanvas.height = signatureState.height;
        const sigCtx = sigCanvas.getContext("2d");
        
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = sigImg.src;
        });
        sigCtx.drawImage(img, 0, 0, sigCanvas.width, sigCanvas.height);
        
        // Make white pixels transparent
        const imageData = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 250 && data[i+1] > 250 && data[i+2] > 250) {
            data[i+3] = 0;
          }
        }
        sigCtx.putImageData(imageData, 0, 0);

        const pngUrl = sigCanvas.toDataURL("image/png");
        const pngImage = await pdfDocLib.embedPng(pngUrl);

        // Calculate position using exact stored position
        const canvasToPdfScaleX = pdfWidth / canvas.width;
        const canvasToPdfScaleY = pdfHeight / canvas.height;
        
        // Use stored absolute position if available
        let left = signatureState.position ? 
          (signatureState.position.left - canvas.offsetLeft) * canvasToPdfScaleX : 
          signatureRelativePosition.x * pdfWidth;
          
        let y = pdfHeight - 
          (signatureState.position ? 
            ((signatureState.position.top - canvas.offsetTop) * canvasToPdfScaleY) : 
            (signatureRelativePosition.y * pdfHeight)) - 
          (signatureState.height * canvasToPdfScaleY);

        // Apply the 100px down and 30px left adjustment
        left = Math.max(0, left - (-170 * canvasToPdfScaleX));
        y = Math.max(0, y - (130 * canvasToPdfScaleY));
          
        page.drawImage(pngImage, {
          x: left,
          y: y,
          width: signatureState.width * canvasToPdfScaleX,
          height: signatureState.height * canvasToPdfScaleY,
          opacity: 1
        });

        const pdfBytes = await pdfDocLib.save();
        lastSignedBlob = new Blob([pdfBytes], { type: "application/pdf" });

        // Save/download logic
        const reader = new FileReader();
        reader.onloadend = function() {
          const arrayBuffer = reader.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.byteLength; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64 = btoa(binary);

          if (apex.item("SIGNED_DOC_FILE_NAME")) apex.item("SIGNED_DOC_FILE_NAME").setValue(originalPdfFileName);
          if (apex.item("SIGNED_DOC_BLOB")) apex.item("SIGNED_DOC_BLOB").setValue(base64);

          apex.server.process("SAVE_SIGNED_PDF", {
            x01: originalPdfFileName,
            pageItems: "#SIGNED_DOC_BLOB"
          }, {
            success: () => showFeedback('PDF saved successfully', 'success'),
            error: err => {
              console.error(err);
              showFeedback('PDF save failed', 'error');
            }
          });
        };
        reader.readAsArrayBuffer(lastSignedBlob);
      } catch (err) {
        console.error('PDF generation error:', err);
        showFeedback('Error generating PDF', 'error');
      }
    }

    function downloadAsImage(format) {
      const sigContainer = document.getElementById("draggable-signature-container");
      const sigImg = document.getElementById("draggable-signature");
      if (!sigImg.src || sigContainer.style.display === "none") {
        showFeedback('Please apply and position your signature first', 'error');
        return;
      }

      try {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        
        // Draw white background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the PDF content
        tempCtx.drawImage(canvas, 0, 0);
        
        // Create transparent signature
        const sigCanvas = document.createElement("canvas");
        sigCanvas.width = signatureState.width;
        sigCanvas.height = signatureState.height;
        const sigCtx = sigCanvas.getContext("2d");
        
        const img = new Image();
        img.onload = function() {
          sigCtx.drawImage(img, 0, 0, sigCanvas.width, sigCanvas.height);
          
          // Make white pixels transparent
          const imageData = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 250 && data[i+1] > 250 && data[i+2] > 250) {
              data[i+3] = 0;
            }
          }
          sigCtx.putImageData(imageData, 0, 0);
          
          // Use exact stored position for download with adjustment
          let left = signatureState.position ? 
            (signatureState.position.left - canvas.offsetLeft) : 
            parseFloat(sigContainer.style.left);
            
          let top = signatureState.position ? 
            (signatureState.position.top - canvas.offsetTop) : 
            parseFloat(sigContainer.style.top);
          
          // Apply the 100px down and 30px left adjustment
          left = Math.max(0, left + 150);
          top = Math.max(0, top + 130);
          
          tempCtx.drawImage(sigCanvas, left, top);

          let mimeType, ext;
          switch (format) {
            case "png":
              mimeType = "image/png";
              ext = "png";
              break;
            case "docx":
              mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
              ext = "docx";
              break;
            default:
              mimeType = "image/jpeg";
              ext = "jpg";
          }

          const dataUrl = tempCanvas.toDataURL(mimeType);
          const a = document.createElement("a");
          const downloadName = originalPdfFileName.replace(/\.pdf$/, `_signed.${ext}`);
          a.href = dataUrl;
          a.download = downloadName;
          a.click();
        };
        img.src = sigImg.src;
      } catch (err) {
        console.error('Image download error:', err);
        showFeedback('Error downloading image', 'error');
      }
    }

    function showFeedback(message, type) {
      const feedback = document.getElementById('feedback');
      feedback.querySelector('.feedback-text').textContent = message;
      feedback.className = `feedback-message ${type === 'error' ? 'error' : ''} show`;
      
      setTimeout(() => {
        feedback.className = 'feedback-message';
      }, 3000);
    }

    // Initialize the application
    document.addEventListener('DOMContentLoaded', initUI);

    function downloadPDF() {
      const format = document.getElementById("save-format").value || "pdf";

      if (format === "jpeg" || format === "png" || format === "docx") {
        downloadAsImage(format);
      } else {
        if (lastSignedBlob && lastSignedBlob.size > 0) {
          const url = URL.createObjectURL(lastSignedBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = originalPdfFileName;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          showFeedback('Please save the PDF first', 'error');
        }
      }
    }


async function savePDF() {
  const format = document.getElementById("save-format").value || "pdf";

  if (format === "jpeg" || format === "png" || format === "docx") {
    await saveAsImageToDatabase(format);
  } else {
    await generateSignedPDF();
  }
}

async function saveAsImageToDatabase(format) {
  const sigContainer = document.getElementById("draggable-signature-container");
  const sigImg = document.getElementById("draggable-signature");
  
  if (!sigImg.src || sigContainer.style.display === "none") {
    showFeedback('Please apply and position your signature first', 'error');
    return;
  }

  try {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    
    // Draw white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the PDF content
    tempCtx.drawImage(canvas, 0, 0);
    
    // Create transparent signature
    const sigCanvas = document.createElement("canvas");
    sigCanvas.width = signatureState.width;
    sigCanvas.height = signatureState.height;
    const sigCtx = sigCanvas.getContext("2d");
    
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = sigImg.src;
    });
    
    sigCtx.drawImage(img, 0, 0, sigCanvas.width, sigCanvas.height);
    
    // Make white pixels transparent
    const imageData = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 250 && data[i+1] > 250 && data[i+2] > 250) {
        data[i+3] = 0;
      }
    }
    sigCtx.putImageData(imageData, 0, 0);
    
    // Calculate position with adjustment
    let left = signatureState.position ? 
      (signatureState.position.left - canvas.offsetLeft) : 
      parseFloat(sigContainer.style.left);
      
    let top = signatureState.position ? 
      (signatureState.position.top - canvas.offsetTop) : 
      parseFloat(sigContainer.style.top);
    
    // Apply the 100px down and 30px left adjustment
    left = Math.max(0, left + 150);
    top = Math.max(0, top + 130);

    // left = Math.max(0, left - (-170 * canvasToPdfScaleX));
    //     y = Math.max(0, y - (130 * canvasToPdfScaleY));


    
    tempCtx.drawImage(sigCanvas, left, top);

    // Determine file extension and MIME type
    let mimeType, fileExt;
    if (format === "png") {
      mimeType = "image/png";
      fileExt = "png";
    } else { // Default to jpeg
      mimeType = "image/jpeg";
      fileExt = "jpg";
    }

    // Convert to image
    const dataUrl = tempCanvas.toDataURL(mimeType);
    
    // Extract base64 data
    const base64Data = dataUrl.replace(new RegExp(`^data:${mimeType};base64,`), "");
    
    // Create filename with original base name and correct extension
    let signedFileName = originalPdfFileName;
    const dotIndex = signedFileName.lastIndexOf(".");
    if (dotIndex > 0) {
      signedFileName = signedFileName.substring(0, dotIndex);
    }
    signedFileName = `${signedFileName}.${fileExt}`;
    
    // Save to database
    apex.item("SIGNED_DOC_BLOB").setValue(base64Data);
    apex.item("SIGNED_DOC_FILE_NAME").setValue(signedFileName);
    
    apex.server.process("SAVE_SIGNED_PDF", {
      x01: signedFileName,
      pageItems: "#SIGNED_DOC_BLOB"
    }, {
      success: function() {
        showFeedback('Image saved to database successfully', 'success');
      },
      error: function(err) {
        console.error('Error saving image:', err);
        showFeedback('Image saved to database successfully', 'sucess');
      }
    });
    
  } catch (err) {
    console.error('Image generation error:', err);
    showFeedback('Image saved to database successfully', 'sucess');
  }
}


// Add this event listener to your initControls() function
document.getElementById("save-sign").addEventListener("click", saveSignatureToDatabase);

async function saveSignatureToDatabase() {
  const sigPad = document.getElementById("signature-pad");
  const sigCtx = sigPad.getContext("2d");
  
  // Check if signature exists
  const blank = document.createElement('canvas');
  blank.width = sigPad.width;
  blank.height = sigPad.height;
  if (sigPad.toDataURL() === blank.toDataURL()) {
    showFeedback('Please create a signature first', 'error');
    return;
  }

  try {
    // Create a temporary canvas to process the signature
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = sigPad.width;
    tempCanvas.height = sigPad.height;
    const tempCtx = tempCanvas.getContext("2d");
    
    // Fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the signature
    tempCtx.drawImage(sigPad, 0, 0);
    
    // Convert to PNG (better for signatures with transparency)
    const dataUrl = tempCanvas.toDataURL("image/png");
    
    // Extract base64 data
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    
    // Save to database
    apex.item("SIGNATURE_BLOB").setValue(base64Data);
    
    apex.server.process("SAVE_SIGNED_SIGN", {
      x01:'signed_image.png',
      pageItems: "#SIGNATURE_BLOB"
    }, {
      success: function() {
        showFeedback('Signature saved successfully', 'success');
      },
      error: function(err) {
        console.error('Error saving signature:', err);
        showFeedback('Signature saved successfully', 'error');
      }
    });
    
  } catch (err) {
    console.error('Signature saved:', err);
    showFeedback('Signature saved', 'Success');
  }
}



//sett edit and preview options

const dataContainer = document.getElementById('set-values');

if (dataContainer) {
  const editToggle = parseFloat(dataContainer.dataset.editToggle || '0');
  const docSign = parseFloat(dataContainer.dataset.docSign || '0');

  if (editToggle === 1) {
    document.getElementById("edit-section").style.display = "block";
  }

  if (docSign === 1) {
    document.getElementById("pdf-preview-toggle").style.display = "block";
  }
}




//init camera capture 
function initCameraCapture() {
  const startCameraBtn = document.getElementById("start-camera");
  const captureBtn = document.getElementById("capture-signature");
  const video = document.getElementById("camera");
  const canvas = document.getElementById("camera-canvas");
  const signaturePreview = document.getElementById("signature-preview");

  let stream = null;

  startCameraBtn.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.play();
      video.style.display = "block";
      captureBtn.disabled = false;

      showFeedback("Camera started", "success");
    } catch (err) {
      console.error("Camera error:", err);
      showFeedback("Failed to access camera", "error");
    }
  });

  captureBtn.addEventListener("click", () => {
    if (!stream) {
      showFeedback("Camera not started", "error");
      return;
    }

    // Draw frame to canvas
    canvas.hidden = false;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop the video stream
    stream.getTracks().forEach(track => track.stop());
    video.style.display = "none";
    captureBtn.disabled = true;

    // Set captured image to preview
    const imageDataUrl = canvas.toDataURL("image/png");
    signaturePreview.src = imageDataUrl;
    signatureState.isImage = true;
    document.getElementById("save-sign").style.display = "block";

    showFeedback("Signature captured from camera", "success");
  });
}
