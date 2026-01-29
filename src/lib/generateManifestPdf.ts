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

// Known city/area order from pickup point (closest to farthest from destination)
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

// Truncate text to fit in cell
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 2) + '..';
};

// Get payment status short label
const getPaymentLabel = (status: string): string => {
  switch (status) {
    case 'paid': return '✓';
    case 'pending': return '○';
    case 'waiting_verification': return '◐';
    case 'cancelled': return '✗';
    default: return '?';
  }
};

// Format date to Indonesian
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const generateManifestPdf = async (data: ManifestData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Sort passengers by location
  const sortedPassengers = sortPassengersByLocation(data.passengers, data.routeFrom, data.routeTo);

  const logoBase64 = await loadLogo();

  // ============ HEADER ============
  const headerHeight = 28;
  
  // Logo on left
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, y, 12, 12);
  }

  // Title and company
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('MANIFES PERJALANAN', margin + 15, y + 5);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('44 TRANS JAWA BALI', margin + 15, y + 10);

  // Route info on the right side of header
  const route = data.routeVia 
    ? `${data.routeFrom} → ${data.routeVia} → ${data.routeTo}`
    : `${data.routeFrom} → ${data.routeTo}`;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(route, pageWidth - margin, y + 4, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDate(data.tripDate)} | Jam: ${data.pickupTime}`, pageWidth - margin, y + 9, { align: 'right' });

  y += 14;

  // Agent & Driver Info Row
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const infoY = y;
  doc.text(`Agent: ${data.agentName}`, margin, infoY);
  doc.text(`Armada: ${data.vehicleNumber || '-'}`, margin + 45, infoY);
  doc.text(`Sopir: ${data.driverName || '-'} (${data.driverPhone || '-'})`, margin + 90, infoY);
  
  // Summary
  const totalPassengers = data.passengers.reduce((sum, p) => sum + p.passengers, 0);
  const paidCount = data.passengers.filter(p => p.paymentStatus === 'paid').length;
  doc.text(`Total: ${totalPassengers} pax | Lunas: ${paidCount}/${data.passengers.length}`, pageWidth - margin, infoY, { align: 'right' });

  y += 6;

  // Divider line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;

  // ============ TABLE HEADER ============
  const rowHeight = 6;
  const colWidths = {
    no: 6,
    name: 30,
    phone: 22,
    pax: 8,
    pickup: 55,
    dropoff: 50,
    notes: 18,
    pay: 5,
  };

  const drawTableHeader = () => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    let x = margin + 1;
    doc.text('No', x, y + 4);
    x += colWidths.no;
    doc.text('Nama', x, y + 4);
    x += colWidths.name;
    doc.text('Telp', x, y + 4);
    x += colWidths.phone;
    doc.text('Pax', x, y + 4);
    x += colWidths.pax;
    doc.text('Alamat Jemput', x, y + 4);
    x += colWidths.pickup;
    doc.text('Alamat Tujuan', x, y + 4);
    x += colWidths.dropoff;
    doc.text('Ket', x, y + 4);
    x += colWidths.notes;
    doc.text('$', x, y + 4);

    y += rowHeight;
  };

  // Draw table borders for a row
  const drawRowBorders = (rowY: number) => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.1);
    
    let x = margin;
    // Vertical lines
    doc.line(x, rowY, x, rowY + rowHeight);
    x += colWidths.no;
    doc.line(x, rowY, x, rowY + rowHeight);
    x += colWidths.name;
    doc.line(x, rowY, x, rowY + rowHeight);
    x += colWidths.phone;
    doc.line(x, rowY, x, rowY + rowHeight);
    x += colWidths.pax;
    doc.line(x, rowY, x, rowY + rowHeight);
    x += colWidths.pickup;
    doc.line(x, rowY, x, rowY + rowHeight);
    x += colWidths.dropoff;
    doc.line(x, rowY, x, rowY + rowHeight);
    x += colWidths.notes;
    doc.line(x, rowY, x, rowY + rowHeight);
    doc.line(pageWidth - margin, rowY, pageWidth - margin, rowY + rowHeight);
    
    // Bottom line
    doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight);
  };

  const rowsPerPage = 14;
  let currentRow = 0;

  // Draw initial header
  drawTableHeader();

  // ============ TABLE ROWS ============
  sortedPassengers.forEach((passenger, index) => {
    // Check if we need a new page (14 rows per page)
    if (currentRow >= rowsPerPage) {
      doc.addPage();
      y = margin + 5;
      
      // Mini header on subsequent pages
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`MANIFES - ${data.routeFrom} → ${data.routeTo} - ${formatDate(data.tripDate)} - Hal ${doc.getNumberOfPages()}`, margin, y);
      y += 4;
      
      drawTableHeader();
      currentRow = 0;
    }

    const rowY = y;
    
    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
    }

    // Draw row data
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    let x = margin + 1;
    
    // No
    doc.text(`${index + 1}`, x, rowY + 4);
    x += colWidths.no;
    
    // Name (truncate to fit)
    doc.setFont('helvetica', 'bold');
    doc.text(truncateText(passenger.name, 18), x, rowY + 4);
    doc.setFont('helvetica', 'normal');
    x += colWidths.name;
    
    // Phone
    doc.text(truncateText(passenger.phone, 14), x, rowY + 4);
    x += colWidths.phone;
    
    // Passengers count
    doc.text(`${passenger.passengers}`, x + 2, rowY + 4);
    x += colWidths.pax;
    
    // Pickup address (truncate)
    doc.text(truncateText(passenger.pickupAddress, 38), x, rowY + 4);
    x += colWidths.pickup;
    
    // Dropoff address (truncate)
    doc.text(truncateText(passenger.dropoffAddress || '-', 32), x, rowY + 4);
    x += colWidths.dropoff;
    
    // Notes/special info (compact)
    const notesArr: string[] = [];
    if (passenger.hasLargeLuggage) notesArr.push('📦');
    if (passenger.hasPackageDelivery) notesArr.push('📬');
    if (passenger.specialRequests) notesArr.push('⚠️');
    if (passenger.notes) notesArr.push('📝');
    doc.text(notesArr.join('') || '-', x, rowY + 4);
    x += colWidths.notes;
    
    // Payment status
    doc.text(getPaymentLabel(passenger.paymentStatus), x, rowY + 4);

    // Draw borders
    drawRowBorders(rowY);

    y += rowHeight;
    currentRow++;
  });

  // ============ FOOTER ============
  y += 3;
  
  // Notes legend
  doc.setFontSize(5);
  doc.setTextColor(100, 100, 100);
  doc.text('Keterangan: 📦=Barang Besar | 📬=Titipan | ⚠️=Permintaan Khusus | 📝=Catatan | ✓=Lunas | ○=Belum Bayar | ◐=Verifikasi', margin, y);
  y += 3;

  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')} | Agent: ${data.agentName}`, margin, y);

  // ============ SAVE ============
  const dateStr = data.tripDate.replace(/-/g, '');
  const fileName = `Manifes-${data.routeFrom}-${data.routeTo}-${dateStr}.pdf`;
  doc.save(fileName);
};
