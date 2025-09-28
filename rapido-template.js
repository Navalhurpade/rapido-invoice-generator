// Rapido Booking History Template
// This file contains the template and styling for generating Rapido-style booking history documents

class RapidoTemplate {
  constructor() {
    this.primaryColor = [255, 107, 53]; // Orange
    this.purpleColor = [128, 0, 128]; // Purple for border
    this.darkColor = [51, 51, 51];
    this.lightGray = [240, 240, 240];
    this.greenColor = [34, 197, 94]; // Green for pickup
    this.redColor = [239, 68, 68]; // Red for drop
  }

  // Generate a single Rapido booking history PDF
  async generateBookingHistoryPDF(invoice) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Set page dimensions
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;

    // Header Section
    await this.addHeader(pdf, invoice, margin);

    // Customer and Ride Details
    this.addRideDetails(pdf, invoice, margin);

    // Selected Price Section
    this.addPriceSection(pdf, invoice, margin);

    // Address Section
    this.addAddressSection(pdf, invoice, margin);

    // Footer/Disclaimer
    this.addFooter(pdf, margin);

    return pdf;
  }

  async addHeader(pdf, invoice, margin) {
    let yPos = margin + 10;
    const headerPageWidth = pdf.internal.pageSize.getWidth();

    // Booking History title (left side)
    pdf.setTextColor(...this.darkColor);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Booking History', margin + 5, yPos);

    // Add logo image (right side)
    try {
      const logoDataUrl = await this.loadImageAsDataUrl('./logo.jpg');
      pdf.addImage(logoDataUrl, 'JPEG', headerPageWidth - margin - 30, yPos - 8, 18, 10);
    } catch (error) {
      console.warn('Logo failed to load, using text fallback:', error);
      // Fallback to text if image loading fails
      pdf.setTextColor(...this.darkColor);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RAPIDO', headerPageWidth - margin - 20, yPos);
    }
  }

  loadImageAsDataUrl(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Remove crossOrigin for local files
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (canvasError) {
          reject(canvasError);
        }
      };
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = src;

      // Timeout after 2 seconds if image doesn't load
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error('Image load timeout'));
        }
      }, 2000);
    });
  }

  addRideDetails(pdf, invoice, margin) {
    let yPos = margin + 25;
    const detailsPageWidth = pdf.internal.pageSize.getWidth();
    const rightX = detailsPageWidth - margin - 5;

    // Rows styling
    pdf.setTextColor(...this.darkColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);

    // Customer name
    pdf.text('Customer Name:', margin + 5, yPos);
    pdf.text('Naval hurpade', rightX, yPos, { align: 'right' });
    yPos += 8;

    // Ride ID
    pdf.text('Ride ID:', margin + 5, yPos);
    pdf.text(invoice.rideId, rightX, yPos, { align: 'right' });
    yPos += 8;

    // Driver name
    pdf.text('Driver name:', margin + 5, yPos);
    pdf.text(invoice.driverName, rightX, yPos, { align: 'right' });
    yPos += 8;

    // Vehicle Number
    pdf.text('Vehicle Number:', margin + 5, yPos);
    pdf.text(invoice.vehicleNumber, rightX, yPos, { align: 'right' });
    yPos += 8;

    // Mode of Vehicle
    pdf.text('Mode of Vehicle:', margin + 5, yPos);
    pdf.text('Auto', rightX, yPos, { align: 'right' });
    yPos += 8;

    // Time of Ride
    const formattedDate = this.formatDate(invoice.date);
    const formattedTime = this.formatTime(invoice.time);
    pdf.text('Time of Ride:', margin + 5, yPos);
    pdf.text(`${formattedDate}, ${formattedTime}`, rightX, yPos, { align: 'right' });
  }

  addPriceSection(pdf, invoice, margin) {
    let yPos = margin + 70;
    const pricePageWidth = pdf.internal.pageSize.getWidth();

    // Larger price box background
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin + 5, yPos, pricePageWidth - 2 * margin - 10, 25, 'F');

    // Centered Selected Price label
    pdf.setTextColor(...this.darkColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.text('Selected Price', pricePageWidth / 2, yPos + 8, { align: 'center' });

    // Centered and larger price amount with proper formatting
//     pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(38, 38, 38);
    pdf.setFontSize(20);
    const priceText = `Rs.${invoice.price}`;
    pdf.text(priceText, pricePageWidth / 2, yPos + 18, { align: 'center' });
  }

  addAddressSection(pdf, invoice, margin) {
    let yPos = margin + 105; // Adjusted for larger price box
    const addressPageWidth = pdf.internal.pageSize.getWidth();

    // Address box background
    pdf.setFillColor(...this.lightGray);
    pdf.rect(margin + 5, yPos, addressPageWidth - 2 * margin - 10, 40, 'F');

    // Pickup address with green dot
    pdf.setFillColor(...this.greenColor);
    const dotX = margin + 10;
    const topDotY = yPos + 8;
    const bottomDotY = yPos + 28;
    const radius = 2;
    pdf.circle(dotX, topDotY, radius, 'F');

    // Pickup address with larger font and text wrapping
    pdf.setTextColor(...this.darkColor);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const maxWidth = addressPageWidth - 2 * margin - 25; // Account for dot and margins
    const pickupLines = pdf.splitTextToSize(invoice.pickup, maxWidth);
    let currentY = yPos + 10;
    pickupLines.forEach((line, index) => {
      if (index === 0 || currentY < yPos + 20) { // Ensure it fits in top half
        pdf.text(line, margin + 18, currentY);
        currentY += 4;
      }
    });

    // Vertical line centered between dots (tangent to both)
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(dotX, topDotY + radius, dotX, bottomDotY - radius);

    // Drop address with red dot
    pdf.setFillColor(...this.redColor);
    pdf.circle(dotX, bottomDotY, radius, 'F');

    // Drop address with larger font and text wrapping
    pdf.setTextColor(...this.darkColor);
    const dropLines = pdf.splitTextToSize(invoice.drop, maxWidth);
    currentY = yPos + 30;
    dropLines.forEach((line, index) => {
      if (index === 0 || currentY < yPos + 38) { // Ensure it fits in bottom half
        pdf.text(line, margin + 18, currentY);
        currentY += 4;
      }
    });
  }

  addFooter(pdf, margin) {
    let yPos = margin + 155; // Adjusted for larger sections above
    const footerPageWidth = pdf.internal.pageSize.getWidth();

    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const disclaimer1 =
      'This document is issued on request by the passenger. Rapido does not collect any fee/commission from passengers and shall not issue tax invoices to the passengers under this segment. The document may be used for all official / reimbursement purposes.';
    const disclaimer2 =
      '*Selected Price refers to the initial price decided between User and Drivers from the estimated price range';

    // Split long text into multiple lines
    const lines1 = pdf.splitTextToSize(disclaimer1, footerPageWidth - 2 * margin - 10);
    const lines2 = pdf.splitTextToSize(disclaimer2, footerPageWidth - 2 * margin - 10);

    lines1.forEach((line, index) => {
      pdf.text(line, margin + 5, yPos + index * 4);
    });

    yPos += lines1.length * 4 + 5;

    lines2.forEach((line, index) => {
      pdf.text(line, margin + 5, yPos + index * 4);
    });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // Add ordinal suffix
    const suffix = this.getOrdinalSuffix(day);
    return `${month} ${day}${suffix} ${year}`;
  }

  formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getOrdinalSuffix(day) {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }

  // Generate merged PDF with all invoices
  async generateMergedPDF(invoices) {
    if (invoices.length === 0) {
      throw new Error('No invoices to merge');
    }

    if (!window.PDFLib || !window.PDFLib.PDFDocument) {
      throw new Error('PDF-LIB is not loaded');
    }

    const { PDFDocument } = window.PDFLib;
    const mergedPdfDoc = await PDFDocument.create();

    // Build each invoice PDF using jsPDF and merge via pdf-lib
    for (let i = 0; i < invoices.length; i++) {
      const invoicePdf = await this.generateBookingHistoryPDF(invoices[i]);
      const invoiceBytes = invoicePdf.output('arraybuffer');
      const srcDoc = await PDFDocument.load(invoiceBytes);
      const pageIndices = srcDoc.getPageIndices();
      const copiedPages = await mergedPdfDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((p) => mergedPdfDoc.addPage(p));
    }

    const mergedBytes = await mergedPdfDoc.save();
    return new Blob([mergedBytes], { type: 'application/pdf' });
  }
}

// Export for use in main script
window.RapidoTemplate = RapidoTemplate;
