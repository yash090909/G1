import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, CompanyProfile, InvoiceItem } from '../types';
import { numberToWords, formatCurrency, formatDate } from '../utils';

export const generateInvoicePDF = (invoice: Invoice, profile: CompanyProfile) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // -- Fonts & Styling
  doc.setFont('helvetica');

  // -- Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(profile.address, pageWidth / 2, 21, { align: 'center' });
  doc.text(`Phone: ${profile.phone} | Email: ${profile.email}`, pageWidth / 2, 26, { align: 'center' });
  doc.text(`DL No: ${profile.dlNo1}, ${profile.dlNo2}`, pageWidth / 2, 31, { align: 'center' });
  doc.text(`GSTIN: ${profile.gstin}`, pageWidth / 2, 36, { align: 'center' });

  doc.line(10, 39, pageWidth - 10, 39); // Separator

  // -- Invoice Details Box
  const startY = 42;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("TAX INVOICE", pageWidth - 20, 10, { align: 'right' }); // Top corner label

  // Left Side: Buyer Details
  doc.text("Billed To:", 12, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.partyName, 12, startY + 5);
  const splitAddr = doc.splitTextToSize(invoice.partyAddress || '', 80);
  doc.text(splitAddr, 12, startY + 10);
  doc.text(`GSTIN: ${invoice.partyGstin || 'N/A'}`, 12, startY + 10 + (splitAddr.length * 4) + 2);
  
  // Right Side: Invoice Meta
  doc.text(`Invoice No: ${invoice.invoiceNo}`, 120, startY);
  doc.text(`Date: ${formatDate(invoice.date)}`, 120, startY + 5);
  doc.text(`Transport: ${invoice.logistics.transport || '-'}`, 120, startY + 10);
  doc.text(`Vehicle No: ${invoice.logistics.vehicleNo || '-'}`, 120, startY + 15);
  doc.text(`GR No: ${invoice.logistics.grNo || '-'}`, 120, startY + 20);
  
  // -- Items Table
  // @ts-ignore
  autoTable(doc, {
    startY: startY + 30,
    head: [['SN', 'Product', 'HSN', 'Batch', 'Exp', 'Qty', 'Free', 'Rate', 'Disc%', 'GST%', 'Taxable', 'Amount']],
    body: invoice.items.map((item, index) => [
      index + 1,
      item.productName,
      item.hsn,
      item.batch,
      formatDate(item.expiry),
      item.qty,
      item.freeQty || 0,
      item.rate.toFixed(2),
      item.discountPercent,
      item.gstRate,
      item.taxableValue.toFixed(2),
      item.totalAmount.toFixed(2)
    ]),
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      1: { cellWidth: 40 }, // Product name wider
      11: { halign: 'right' } // Amount right aligned
    }
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 5;

  // -- Footer Calculation
  const boxX = 120;
  const boxWidth = pageWidth - 10 - boxX;
  
  doc.setFontSize(9);
  doc.text("Sub Total:", boxX + 2, finalY + 5);
  doc.text(invoice.subTotal.toFixed(2), pageWidth - 12, finalY + 5, { align: 'right' });

  doc.text("GST Amount:", boxX + 2, finalY + 10);
  doc.text(invoice.totalGst.toFixed(2), pageWidth - 12, finalY + 10, { align: 'right' });

  doc.text("Round Off:", boxX + 2, finalY + 15);
  doc.text(invoice.roundOff.toFixed(2), pageWidth - 12, finalY + 15, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("Grand Total:", boxX + 2, finalY + 22);
  doc.text(formatCurrency(invoice.grandTotal), pageWidth - 12, finalY + 22, { align: 'right' });

  // -- Amount in words
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("Amount in Words:", 12, finalY + 5);
  doc.setFont('helvetica', 'bold italic');
  doc.text(`${numberToWords(Math.round(invoice.grandTotal))} Rupees Only`, 12, finalY + 10);

  // -- Terms & Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const termsY = finalY + 30;
  doc.text("Terms & Conditions:", 12, termsY);
  const splitTerms = doc.splitTextToSize(profile.terms, 100);
  doc.text(splitTerms, 12, termsY + 5);

  doc.setFontSize(10);
  doc.text("For Gopi Distributors", pageWidth - 50, termsY, { align: 'center' });
  doc.rect(pageWidth - 70, termsY + 5, 40, 15); // Sig box
  doc.text("Authorized Signatory", pageWidth - 50, termsY + 25, { align: 'center' });

  // Save
  doc.save(`${invoice.invoiceNo}.pdf`);
};
