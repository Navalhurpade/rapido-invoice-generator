// Sample data for random generation
const driverNames = [
  'Rajesh Kumar',
  'Suresh Pati',
  'Amit Singh',
  'Akash Taras',
  'Vikram Patel',
  'Ankush Shinde',
  'Ravi Verma',
  'Popalghat Popalghat',
  'Suresh Yadav',
  'ganesh chavan',
  'Arjun Singh',
  'Yogesh Gawari',
  'Manoj Kumar',
  'Naresh Dhanbe',
  'Rohit Jain',
  'Ramesh Malpote',
  'Vishal Tanpure',
  'Prashant Zombade',
  'Yogesh Satav',
  'Chetan Kumbhar',
  'Prashant Rode',
  'Datta Sopan Dhakal',
  'Prashant kamble',
  'Shuaib Issar Ansari',
  'Narayan Boyane',
  'Sachin Devkamble',
  'Nagnath Thete',
  'वैजनाथ िवठल राव शाहु',
  'akash Telang',
  'Kishor Tate',
  'Rohit Patil',
  'Santosh Chormale',
  'DineshChavan',
  'Santosh Rathod'
];

const vehicleNumbers = [
  'MH14GC1505',
  'MH14LS1737',
  'MH12WR0472',
  'MH14LS0408',
  'MH14JP7603',
  'MH14JP6015',
  'MH12WR8694',
  'MH14JP8464',
  'MH12VW7279',
  'MH14KU5630',
  'MH14LS3805',
  'MH14KU2934',
  'MH12QR5358',
  'MH12WR2648',
  'MH14HM9677',
  'MH12TU6037',
  'MH14JP9576',
  'MH14JP7318',
  'MH14JP9115',
  'MH14JP7161',
  'MH24AT4850',
  'MH14KU3834',
  'MH14JP9957',
  'MH12VW7542', 
  'MH14JP2440',
  'MH14JP4925'
];

// Global variables
let generatedInvoices = [];
let rapidoTemplate = null;
let currentUserName = '';

function ensureRapidoTemplate() {
  if (!rapidoTemplate) {
    if (typeof RapidoTemplate === 'undefined') {
      throw new Error('RapidoTemplate is not loaded. Please refresh the page and try again.');
    }
    rapidoTemplate = new RapidoTemplate();
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('invoiceForm');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const downloadIndividualBtn = document.getElementById('downloadIndividualBtn');
  const downloadMergedBtn = document.getElementById('downloadMergedBtn');

  form.addEventListener('submit', handleFormSubmit);
  downloadAllBtn.addEventListener('click', downloadAllAsZip);
  downloadIndividualBtn.addEventListener('click', downloadIndividualPDFs);
  downloadMergedBtn.addEventListener('click', downloadMergedPDF);

  // Initialize Rapido template
  try {
    if (typeof RapidoTemplate !== 'undefined') {
      rapidoTemplate = new RapidoTemplate();
    } else {
      console.warn('RapidoTemplate not loaded yet, will initialize on first use');
    }
  } catch (error) {
    console.warn('Error initializing RapidoTemplate:', error);
  }

  // Set default dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  document.getElementById('startDate').value = today.toISOString().split('T')[0];
  document.getElementById('endDate').value = tomorrow.toISOString().split('T')[0];
});

// Add address input field
function addAddress(type) {
  const container = document.getElementById(type + 'Addresses');
  const addressInput = document.createElement('div');
  addressInput.className = 'address-input';
  addressInput.innerHTML = `
        <input type="text" placeholder="Enter ${type} address" class="address-field" required>
        <button type="button" class="remove-btn" onclick="removeAddress(this, '${type}')">×</button>
    `;
  container.appendChild(addressInput);
}

// Remove address input field
function removeAddress(button, type) {
  const container = document.getElementById(type + 'Addresses');
  if (container.children.length > 1) {
    button.parentElement.remove();
  } else {
    alert(`At least one ${type} address is required.`);
  }
}

// Handle form submission
function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const pickupAddresses = Array.from(document.querySelectorAll('#pickupAddresses .address-field'))
    .map((input) => input.value.trim())
    .filter((value) => value);

  const dropAddresses = Array.from(document.querySelectorAll('#dropAddresses .address-field'))
    .map((input) => input.value.trim())
    .filter((value) => value);

  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);
  const entryStartTime = document.getElementById('entryStartTime').value;
  const entryEndTime = document.getElementById('entryEndTime').value;
  const exitStartTime = document.getElementById('exitStartTime').value;
  const exitEndTime = document.getElementById('exitEndTime').value;
  const minPrice = parseInt(document.getElementById('minPrice').value);
  const maxPrice = parseInt(document.getElementById('maxPrice').value);
  const userName = document.getElementById('userName').value.trim();
  currentUserName = userName || 'Customer';

  // Validation
  if (pickupAddresses.length === 0 || dropAddresses.length === 0) {
    alert('Please add at least one pickup and one drop address.');
    return;
  }

  if (startDate >= endDate) {
    alert('End date must be after start date.');
    return;
  }

  if (minPrice >= maxPrice) {
    alert('Maximum price must be greater than minimum price.');
    return;
  }

  // Generate invoices
  generatedInvoices = generateInvoices(
    pickupAddresses,
    dropAddresses,
    startDate,
    endDate,
    entryStartTime,
    entryEndTime,
    exitStartTime,
    exitEndTime,
    minPrice,
    maxPrice,
    userName
  );

  displayInvoices(generatedInvoices);
  document.getElementById('results').style.display = 'block';
}

// Generate invoices for the date range (excluding weekends)
function generateInvoices(
  pickupAddresses,
  dropAddresses,
  startDate,
  endDate,
  entryStartTime,
  entryEndTime,
  exitStartTime,
  exitEndTime,
  minPrice,
  maxPrice,
  userName
) {
  const invoices = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Randomly select addresses
      const randomPickup = pickupAddresses[Math.floor(Math.random() * pickupAddresses.length)];
      const randomDrop = dropAddresses[Math.floor(Math.random() * dropAddresses.length)];

      // Generate morning/entry ride
      const entryTime = generateRandomTime(entryStartTime, entryEndTime);
      const entryInvoice = createInvoice(currentDate, entryTime, randomPickup, randomDrop, 'Entry', minPrice, maxPrice, userName);
      invoices.push(entryInvoice);

      // Generate evening/exit ride
      const exitTime = generateRandomTime(exitStartTime, exitEndTime);
      const exitInvoice = createInvoice(currentDate, exitTime, randomDrop, randomPickup, 'Exit', minPrice, maxPrice, userName);
      invoices.push(exitInvoice);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return invoices;
}

// Create a single invoice
function createInvoice(date, time, pickup, drop, type, minPrice, maxPrice, userName) {
  const rideId = generateRideId();
  const driverName = driverNames[Math.floor(Math.random() * driverNames.length)];
  const vehicleNumber = vehicleNumbers[Math.floor(Math.random() * vehicleNumbers.length)];
  const price = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
  const invoiceId = generateInvoiceId();

  return {
    invoiceId,
    rideId,
    driverName,
    vehicleNumber,
    date: date.toISOString().split('T')[0],
    time,
    pickup,
    drop,
    type,
    price,
    totalAmount: price,
    userName
  };
}

// Generate random time within range
function generateRandomTime(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const randomMinutes = Math.floor(Math.random() * (end - start + 1)) + start;
  return minutesToTime(randomMinutes);
}

// Convert time string to minutes
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes to time string
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Generate random ride ID
function generateRideId(length = 17) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10); // Appends a random digit (0-9)
  }
  return `RD${result}`;

}

// Generate random invoice ID
function generateInvoiceId() {
  return 'INV' + Math.random().toString(36).substr(2, 10).toUpperCase();
}

// Display generated invoices
function displayInvoices(invoices) {
  const invoiceList = document.getElementById('invoiceList');
  invoiceList.innerHTML = '';

  invoices.forEach((invoice, index) => {
    const invoicePreview = document.createElement('div');
    invoicePreview.className = 'invoice-preview';
    invoicePreview.innerHTML = `
            <h4>${invoice.type} Ride - ${invoice.date}</h4>
            <p><strong class='label-left' >Ride ID:</strong> ${invoice.rideId}</p>
            <p><strong class='label-left'>Driver:</strong> ${invoice.driverName}</p>
            <p><strong class='label-left'>Vehicle:</strong> ${invoice.vehicleNumber}</p>
            <p><strong class='label-left'>Time:</strong> ${invoice.time}</p>
            <p><strong class='label-left'>Route:</strong> ${invoice.pickup} → ${invoice.drop}</p>
            <p><strong class='label-left'>Amount:</strong> ₹${invoice.totalAmount}</p>
        `;
    invoiceList.appendChild(invoicePreview);
  });
}

// Download merged PDF
async function downloadMergedPDF() {
  if (generatedInvoices.length === 0) {
    alert('No invoices to download. Please generate invoices first.');
    return;
  }

  try {
    ensureRapidoTemplate();
    const mergedBlob = await rapidoTemplate.generateMergedPDF(generatedInvoices);
    const filename = `Rapido_Booking_History_${new Date().toISOString().split('T')[0]}.pdf`;

    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating merged PDF:', error);
    alert(`Error generating merged PDF: ${error.message}`);
  }
}

// Download all invoices as ZIP
async function downloadAllAsZip() {
  if (generatedInvoices.length === 0) {
    alert('No invoices to download. Please generate invoices first.');
    return;
  }

  const zip = new JSZip();
  ensureRapidoTemplate();

  for (let i = 0; i < generatedInvoices.length; i++) {
    const invoice = generatedInvoices[i];
    const pdf = rapidoTemplate.generateBookingHistoryPDF(invoice, currentUserName);
    const filename = `Rapido_Booking_${invoice.invoiceId}_${invoice.date}.pdf`;
    zip.file(filename, pdf.output('blob'));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rapido_Booking_History_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download individual PDFs
async function downloadIndividualPDFs() {
  if (generatedInvoices.length === 0) {
    alert('No invoices to download. Please generate invoices first.');
    return;
  }

  ensureRapidoTemplate();
  for (let i = 0; i < generatedInvoices.length; i++) {
    const invoice = generatedInvoices[i];
    const pdf = rapidoTemplate.generateBookingHistoryPDF(invoice, currentUserName);
    const filename = `Rapido_Booking_${invoice.invoiceId}_${invoice.date}.pdf`;
    pdf.save(filename);
    // small delay between downloads
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => setTimeout(res, 500));
  }
}
