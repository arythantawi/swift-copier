import jsPDF from 'jspdf';
import logo44Trans from '@/assets/logo-44trans.png';

export interface ManifestPassenger {
  name: string;
  phone: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  passengers: number;
  notes: string | null;
  hasLargeLuggage: boolean;
  luggageDescription: string | null;
  hasPackageDelivery: boolean;
  packageDescription: string | null;
  specialRequests: string | null;
  paymentStatus: string;
  sortOrder?: number;
}

export interface ManifestData {
  agentName: string;
  tripDate: string;
  pickupTime: string;
  routeFrom: string;
  routeTo: string;
  routeVia: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  driverPhone: string | null;
  passengers: ManifestPassenger[];
}

// Known city/area order from pickup point
const getLocationOrder = (routeFrom: string, routeTo: string): Record<string, number> => {
  const locationOrders: Record<string, Record<string, number>> = {
    'Banyuwangi-Surabaya': {
      'banyuwangi': 100, 'rogojampi': 95, 'muncar': 90, 'genteng': 85, 'jajag': 80,
      'jember': 70, 'lumajang': 60, 'probolinggo': 50, 'pasuruan': 40, 'sidoarjo': 30, 'surabaya': 10,
    },
    'Surabaya-Banyuwangi': {
      'surabaya': 100, 'sidoarjo': 95, 'pasuruan': 85, 'probolinggo': 75, 'lumajang': 65,
      'jember': 55, 'jajag': 45, 'genteng': 40, 'muncar': 35, 'rogojampi': 30, 'banyuwangi': 10,
    },
    'Banyuwangi-Denpasar': {
      'banyuwangi': 100, 'ketapang': 90, 'gilimanuk': 80, 'negara': 70, 'tabanan': 50,
      'denpasar': 10, 'kuta': 15, 'sanur': 12, 'ubud': 20,
    },
    'Denpasar-Banyuwangi': {
      'denpasar': 100, 'kuta': 98, 'sanur': 97, 'ubud': 95, 'tabanan': 80,
      'negara': 60, 'gilimanuk': 40, 'ketapang': 30, 'banyuwangi': 10,
    },
  };

  const routeKey = `${routeFrom}-${routeTo}`;
  return locationOrders[routeKey] || {};
};

const extractLocationKeyword = (address: string): string => {
  const normalizedAddress = address.toLowerCase();
  const keywords = [
    'surabaya', 'sidoarjo', 'pasuruan', 'probolinggo', 'lumajang', 
    'jember', 'jajag', 'genteng', 'muncar', 'rogojampi', 'banyuwangi',
    'denpasar', 'kuta', 'sanur', 'ubud', 'tabanan', 'negara', 'gilimanuk', 'ketapang'
  ];
  
  for (const keyword of keywords) {
    if (normalizedAddress.includes(keyword)) {
      return keyword;
    }
  }
  return '';
};

const sortPassengersByLocation = (
  passengers: ManifestPassenger[], 
  routeFrom: string, 
  routeTo: string
): ManifestPassenger[] => {
  const locationOrder = getLocationOrder(routeFrom, routeTo);
  
  if (Object.keys(locationOrder).length === 0) {
    return passengers;
  }

  return [...passengers].sort((a, b) => {
    const locA = extractLocationKeyword(a.pickupAddress);
    const locB = extractLocationKeyword(b.pickupAddress);
    
    const orderA = locationOrder[locA] ?? 50;
    const orderB = locationOrder[locB] ?? 50;
    
    return orderB - orderA;
  });
};

// Load logo as base64
const loadLogo = (): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = logo44Trans;
  });
};

// Format date to Indonesian
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Get payment status label
const getPaymentLabel = (status: string): string => {
  switch (status) {
    case 'paid': return 'LUNAS';
    case 'pending': return 'BELUM';
    case 'waiting_verification': return 'VERIF';
    case 'cancelled': return 'BATAL';
    default: return '-';
  }
};

// Wrap text to fit in cell width
const wrapText = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  if (!text) return ['-'];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : ['-'];
};

export const generateManifestPdf = async (data: ManifestData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 10;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = marginTop;

  // Sort passengers by location
  const sortedPassengers = sortPassengersByLocation(data.passengers, data.routeFrom, data.routeTo);

  const logoBase64 = await loadLogo();

  // Colors
  const primaryColor: [number, number, number] = [180, 142, 38]; // Gold
  const darkColor: [number, number, number] = [30, 30, 30];
  const grayColor: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [240, 240, 240];
  const borderColor: [number, number, number] = [200, 200, 200];

  // ============ HEADER SECTION ============
  // Header background
  doc.setFillColor(...lightGray);
  doc.rect(marginLeft, y, contentWidth, 22, 'F');
  
  // Border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(marginLeft, y, marginLeft + contentWidth, y);

  // Logo
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', marginLeft + 3, y + 3, 16, 16);
  }

  // Company name and title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text('44 TRANS JAWA BALI', marginLeft + 22, y + 8);
  
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.text('MANIFES PERJALANAN', marginLeft + 22, y + 14);

  // Route on right side
  const route = data.routeVia 
    ? `${data.routeFrom} - ${data.routeVia} - ${data.routeTo}`
    : `${data.routeFrom} - ${data.routeTo}`;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(route, pageWidth - marginRight - 3, y + 8, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(formatDate(data.tripDate), pageWidth - marginRight - 3, y + 14, { align: 'right' });

  y += 24;

  // ============ INFO ROW ============
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, y, contentWidth, 12, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft, y, contentWidth, 12, 'S');

  const infoY = y + 4;
  const col1 = marginLeft + 3;
  const col2 = marginLeft + 50;
  const col3 = marginLeft + 100;
  const col4 = marginLeft + 150;

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  
  // Row 1
  doc.text('Agent:', col1, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(data.agentName, col1 + 12, infoY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Jam:', col2, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(data.pickupTime, col2 + 10, infoY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Armada:', col3, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(data.vehicleNumber || '-', col3 + 15, infoY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Sopir:', col4, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  const driverInfo = data.driverName ? `${data.driverName}` : '-';
  doc.text(driverInfo, col4 + 12, infoY);

  // Row 2
  const infoY2 = infoY + 5;
  const totalPassengers = data.passengers.reduce((sum, p) => sum + p.passengers, 0);
  const paidCount = data.passengers.filter(p => p.paymentStatus === 'paid').length;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('HP Sopir:', col1, infoY2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(data.driverPhone || '-', col1 + 18, infoY2);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Total Pax:', col2, infoY2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(`${totalPassengers} orang`, col2 + 18, infoY2);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Status Bayar:', col3, infoY2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(`${paidCount} Lunas / ${data.passengers.length} Booking`, col3 + 24, infoY2);

  y += 14;

  // ============ TABLE SECTION ============
  // Column definitions
  const cols = {
    no: { x: marginLeft, w: 8 },
    name: { x: marginLeft + 8, w: 28 },
    phone: { x: marginLeft + 36, w: 24 },
    pax: { x: marginLeft + 60, w: 10 },
    pickup: { x: marginLeft + 70, w: 46 },
    dropoff: { x: marginLeft + 116, w: 40 },
    notes: { x: marginLeft + 156, w: 20 },
    status: { x: marginLeft + 176, w: 19 },
  };
  
  const headerHeight = 8;
  const minRowHeight = 10;

  // Draw table header
  const drawTableHeader = (startY: number): number => {
    // Header background
    doc.setFillColor(...primaryColor);
    doc.rect(marginLeft, startY, contentWidth, headerHeight, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    
    const headerY = startY + 5.5;
    doc.text('NO', cols.no.x + 2, headerY);
    doc.text('NAMA', cols.name.x + 1, headerY);
    doc.text('TELEPON', cols.phone.x + 1, headerY);
    doc.text('PAX', cols.pax.x + 1, headerY);
    doc.text('ALAMAT JEMPUT', cols.pickup.x + 1, headerY);
    doc.text('ALAMAT TUJUAN', cols.dropoff.x + 1, headerY);
    doc.text('KET', cols.notes.x + 1, headerY);
    doc.text('BAYAR', cols.status.x + 1, headerY);
    
    return startY + headerHeight;
  };

  // Draw table row
  const drawTableRow = (passenger: ManifestPassenger, index: number, startY: number): number => {
    doc.setFontSize(7);
    
    // Calculate row height based on address content
    const pickupLines = wrapText(doc, passenger.pickupAddress, cols.pickup.w - 2);
    const dropoffLines = wrapText(doc, passenger.dropoffAddress || '-', cols.dropoff.w - 2);
    const maxLines = Math.max(pickupLines.length, dropoffLines.length, 1);
    const rowHeight = Math.max(minRowHeight, maxLines * 3.5 + 4);

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(marginLeft, startY, contentWidth, rowHeight, 'F');

    // Row border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, startY + rowHeight, marginLeft + contentWidth, startY + rowHeight);

    // Column separators
    doc.setDrawColor(230, 230, 230);
    Object.values(cols).forEach(col => {
      doc.line(col.x, startY, col.x, startY + rowHeight);
    });
    doc.line(marginLeft + contentWidth, startY, marginLeft + contentWidth, startY + rowHeight);

    const textY = startY + 4;
    doc.setTextColor(...darkColor);

    // No
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}`, cols.no.x + 3, textY);

    // Name
    doc.setFont('helvetica', 'bold');
    const nameText = passenger.name.length > 16 ? passenger.name.substring(0, 14) + '..' : passenger.name;
    doc.text(nameText, cols.name.x + 1, textY);

    // Phone
    doc.setFont('helvetica', 'normal');
    const phoneText = passenger.phone.length > 14 ? passenger.phone.substring(0, 12) + '..' : passenger.phone;
    doc.text(phoneText, cols.phone.x + 1, textY);

    // Pax
    doc.setFont('helvetica', 'bold');
    doc.text(`${passenger.passengers}`, cols.pax.x + 3, textY);

    // Pickup address (multiline)
    doc.setFont('helvetica', 'normal');
    pickupLines.forEach((line, i) => {
      doc.text(line, cols.pickup.x + 1, textY + (i * 3.5));
    });

    // Dropoff address (multiline)
    dropoffLines.forEach((line, i) => {
      doc.text(line, cols.dropoff.x + 1, textY + (i * 3.5));
    });

    // Notes/special info
    const notesArr: string[] = [];
    if (passenger.hasLargeLuggage) notesArr.push('Brg');
    if (passenger.hasPackageDelivery) notesArr.push('Ttp');
    if (passenger.specialRequests) notesArr.push('Req');
    if (passenger.notes) notesArr.push('Cat');
    doc.setFontSize(6);
    doc.text(notesArr.join(',') || '-', cols.notes.x + 1, textY);

    // Payment status - centered in column
    doc.setFontSize(5.5);
    const statusLabel = getPaymentLabel(passenger.paymentStatus);
    if (passenger.paymentStatus === 'paid') {
      doc.setTextColor(34, 139, 34); // Green
      doc.setFont('helvetica', 'bold');
    } else if (passenger.paymentStatus === 'pending') {
      doc.setTextColor(200, 150, 0); // Orange
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(...grayColor);
      doc.setFont('helvetica', 'normal');
    }
    // Center the status text in the column
    const statusWidth = doc.getTextWidth(statusLabel);
    const statusX = cols.status.x + (cols.status.w - statusWidth) / 2;
    doc.text(statusLabel, statusX, textY);

    return startY + rowHeight;
  };

  // Start drawing table
  y = drawTableHeader(y);
  
  let currentPage = 1;
  const maxY = pageHeight - 20; // Leave space for footer

  sortedPassengers.forEach((passenger, index) => {
    // Check if we need a new page
    const pickupLines = wrapText(doc, passenger.pickupAddress, cols.pickup.w - 2);
    const dropoffLines = wrapText(doc, passenger.dropoffAddress || '-', cols.dropoff.w - 2);
    const maxLines = Math.max(pickupLines.length, dropoffLines.length, 1);
    const estimatedRowHeight = Math.max(minRowHeight, maxLines * 3.5 + 4);

    if (y + estimatedRowHeight > maxY) {
      // Add page footer
      doc.setFontSize(7);
      doc.setTextColor(...grayColor);
      doc.setFont('helvetica', 'normal');
      doc.text(`Halaman ${currentPage}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

      // New page
      doc.addPage();
      currentPage++;
      y = marginTop;

      // Mini header on new page
      doc.setFillColor(...lightGray);
      doc.rect(marginLeft, y, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...darkColor);
      doc.text(`MANIFES - ${route} - ${formatDate(data.tripDate)}`, marginLeft + 3, y + 5.5);
      doc.text(`Hal ${currentPage}`, pageWidth - marginRight - 3, y + 5.5, { align: 'right' });
      y += 10;

      y = drawTableHeader(y);
    }

    y = drawTableRow(passenger, index, y);
  });

  // ============ FOOTER SECTION ============
  y += 4;

  // Legend box
  doc.setFillColor(...lightGray);
  doc.rect(marginLeft, y, contentWidth, 10, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.rect(marginLeft, y, contentWidth, 10, 'S');

  doc.setFontSize(6);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  
  const legendY = y + 4;
  doc.text('Keterangan:', marginLeft + 3, legendY);
  doc.text('Brg = Barang Besar  |  Ttp = Titipan Paket  |  Req = Permintaan Khusus  |  Cat = Catatan', marginLeft + 22, legendY);
  
  const legendY2 = legendY + 3.5;
  doc.text('Status Bayar:', marginLeft + 3, legendY2);
  doc.setTextColor(34, 139, 34);
  doc.text('LUNAS', marginLeft + 22, legendY2);
  doc.setTextColor(...grayColor);
  doc.text('= Sudah Bayar  |', marginLeft + 34, legendY2);
  doc.setTextColor(200, 150, 0);
  doc.text('BELUM', marginLeft + 52, legendY2);
  doc.setTextColor(...grayColor);
  doc.text('= Belum Bayar  |', marginLeft + 64, legendY2);
  doc.text('VERIF = Menunggu Verifikasi', marginLeft + 82, legendY2);

  y += 12;

  // Print info
  doc.setFontSize(6);
  doc.setTextColor(...grayColor);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')} | Agent: ${data.agentName} | Halaman ${currentPage}`, marginLeft + 3, y + 2);

  // Bottom border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(marginLeft, y + 5, marginLeft + contentWidth, y + 5);

  // ============ SAVE ============
  const dateStr = data.tripDate.replace(/-/g, '');
  const fileName = `Manifes-${data.routeFrom}-${data.routeTo}-${dateStr}.pdf`;
  doc.save(fileName);
};
