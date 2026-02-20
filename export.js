// export.js — Car Research Assistant export page logic

document.addEventListener('DOMContentLoaded', function () {
    const exportBtn    = document.getElementById('exportBtn');
    const statusDiv    = document.getElementById('status');
    const previewTable = document.getElementById('previewTable');

    let savedCars = [];

    // ─────────────────────────────────────────────
    // LOAD DATA
    // ─────────────────────────────────────────────

    chrome.storage.local.get({savedCars: []}, function (result) {
        savedCars = result.savedCars;

        if (savedCars.length === 0) {
            previewTable.innerHTML = '<div class="empty-state">No cars saved yet. Capture some listings first!</div>';
            return;
        }

        // Sort by price low to high
        savedCars = sortCarsByPrice(savedCars);

        renderStats(savedCars);
        renderPreviewTable(savedCars);
        exportBtn.disabled = false;
    });

    // ─────────────────────────────────────────────
    // EXPORT BUTTON
    // ─────────────────────────────────────────────

    exportBtn.addEventListener('click', function () {
        try {
            exportBtn.disabled = true;
            exportBtn.textContent = 'Generating...';

            const wb = buildWorkbook(savedCars);
            const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            XLSX.writeFile(wb, `car-research-${timestamp}.xlsx`);

            showStatus('success', `✓ Exported ${savedCars.length} car(s) to car-research-${timestamp}.xlsx`);
        } catch (err) {
            console.error('[export] Error generating file:', err);
            showStatus('error', `⚠️ Export failed: ${err.message}`);
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = '⬇ Download Excel (.xlsx)';
        }
    });


    // ─────────────────────────────────────────────
    // SORT
    // ─────────────────────────────────────────────

    function sortCarsByPrice(cars) {
        return [...cars].sort((a, b) => {
            const priceA = parsePrice(a.price);
            const priceB = parsePrice(b.price);
            // Push unparseable prices to the bottom
            if (priceA === null && priceB === null) return 0;
            if (priceA === null) return 1;
            if (priceB === null) return -1;
            return priceA - priceB;
        });
    }


    // ─────────────────────────────────────────────
    // SUMMARY STATS
    // ─────────────────────────────────────────────

    function renderStats(cars) {
        const total = cars.length;
        const withComplaints = cars.filter(c => c.complaintData && c.complaintData.length > 0).length;
        const salvage = cars.filter(c => c.titleStatus && c.titleStatus !== 'clean' && c.titleStatus !== 'unknown').length;

        const prices = cars.map(c => parsePrice(c.price)).filter(p => p !== null);
        const avgPrice = prices.length > 0
            ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
            : null;

        document.getElementById('statTotal').textContent          = total;
        document.getElementById('statWithComplaints').textContent = withComplaints;
        document.getElementById('statSalvage').textContent        = salvage;
        document.getElementById('statAvgPrice').textContent       = avgPrice !== null
            ? `$${avgPrice.toLocaleString()}`
            : '—';
    }


    // ─────────────────────────────────────────────
    // PREVIEW TABLE
    // ─────────────────────────────────────────────

    function renderPreviewTable(cars) {
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Vehicle</th>
                        <th>Price</th>
                        <th>Mileage</th>
                        <th>Title</th>
                        <th>Complaints</th>
                        <th>Source</th>
                    </tr>
                </thead>
                <tbody>
        `;

        cars.forEach(car => {
            const titleStatus = car.titleStatus;
            const isSalvage   = titleStatus && titleStatus !== 'clean' && titleStatus !== 'unknown';
            const hasComplaints = car.complaintData && car.complaintData.length > 0;

            const titleBadge = isSalvage
                ? '<span class="badge red">SALVAGE</span>'
                : titleStatus === 'clean'
                    ? '<span class="badge green">CLEAN</span>'
                    : '<span class="badge grey">UNKNOWN</span>';

            const complaintBadge = hasComplaints
                ? '<span class="badge yellow">YES</span>'
                : '<span class="badge grey">NO</span>';

            html += `
                <tr>
                    <td>${car.title || '—'}</td>
                    <td>${car.price || '—'}</td>
                    <td>${car.mileage || '—'}</td>
                    <td>${titleBadge}</td>
                    <td>${complaintBadge}</td>
                    <td>${car.site || '—'}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        previewTable.innerHTML = html;
    }


    // ─────────────────────────────────────────────
    // BUILD WORKBOOK
    // ─────────────────────────────────────────────

    function buildWorkbook(cars) {
        const wb = XLSX.utils.book_new();
        const ws = buildMainSheet(cars);
        XLSX.utils.book_append_sheet(wb, ws, 'Car Research');
        return wb;
    }

    function buildMainSheet(cars) {
        // ── Headers ───────────────────────────────
        const headers = [
            'Title',
            'Year',
            'Make',
            'Model',
            'Mileage',
            'Price ($)',
            'Price Per Mile ($)',
            'Dealer',
            'Location',
            'VIN',
            'Title Status',
            'Salvage Dealer',
            'Source',
            'Listing URL',
            'NHTSA Issue #1',
            'NHTSA Issue #2',
            'NHTSA Issue #3',
            'Total NHTSA Complaints',
            'Complaint Data',
            'Complaints Fetched Date',
            'Saved Date'
        ];

        const rows = [headers];

        cars.forEach((car, i) => {
            const excelRow = i + 2; // Row 1 = headers, data starts at row 2

            const { year, make, model } = parseCarTitle(car.title || '');
            const price   = parsePrice(car.price);
            const mileage = parseMileage(car.mileage);

            // Price Per Mile — Excel formula, not hardcoded
            // E = Price ($), F = Mileage
            const pricePerMileFormula = (price !== null && mileage !== null && mileage > 0)
                ? { f: `E${excelRow}/F${excelRow}` }
                : '—';

            // Complaint data
            const overview    = car.complaintData && car.complaintData.find(c => c.type === 'overview');
            const issue1      = overview && overview.top3Categories[0] ? cleanCategory(overview.top3Categories[0].category) : '—';
            const issue2      = overview && overview.top3Categories[1] ? cleanCategory(overview.top3Categories[1].category) : '—';
            const issue3      = overview && overview.top3Categories[2] ? cleanCategory(overview.top3Categories[2].category) : '—';
            const totalNHTSA  = overview ? overview.totalNHTSAComplaints : '—';
            const fetchedDate = car.complaintsLastUpdated
                ? new Date(car.complaintsLastUpdated).toLocaleDateString()
                : '—';

            rows.push([
                car.title        || '—',
                year             || '—',
                make             || '—',
                model            || '—',
                mileage          !== null ? mileage : '—',
                price            !== null ? price   : '—',
                pricePerMileFormula,
                car.dealer       || '—',
                car.location     || '—',
                car.vin          || '—',
                formatTitleStatus(car.titleStatus),
                car.knownSalvageDealer ? 'Yes' : 'No',
                car.site         || '—',
                car.url          || '—',
                issue1,
                issue2,
                issue3,
                totalNHTSA,
                overview ? 'Yes' : 'No',
                fetchedDate,
                car.timestamp ? new Date(car.timestamp).toLocaleDateString() : '—'
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // ── Column Widths ──────────────────────────
        ws['!cols'] = [
            { wch: 32 },  // Title
            { wch: 6  },  // Year
            { wch: 14 },  // Make
            { wch: 14 },  // Model
            { wch: 12 },  // Price
            { wch: 12 },  // Mileage
            { wch: 16 },  // Price Per Mile
            { wch: 24 },  // Dealer
            { wch: 20 },  // Location
            { wch: 20 },  // VIN
            { wch: 14 },  // Title Status
            { wch: 14 },  // Salvage Dealer
            { wch: 14 },  // Source
            { wch: 40 },  // Listing URL
            { wch: 28 },  // NHTSA Issue #1
            { wch: 28 },  // NHTSA Issue #2
            { wch: 28 },  // NHTSA Issue #3
            { wch: 20 },  // Total NHTSA
            { wch: 14 },  // Complaint Data
            { wch: 18 },  // Fetched Date
            { wch: 14 },  // Saved Date
        ];

        // ── Freeze header row ──────────────────────
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };

        return ws;
    }


    // ─────────────────────────────────────────────
    // PARSERS
    // ─────────────────────────────────────────────

    function parsePrice(priceStr) {
        if (!priceStr) return null;
        const match = priceStr.replace(/,/g, '').match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }

    function parseMileage(mileageStr) {
        if (!mileageStr) return null;
        if (mileageStr.toLowerCase().includes('new car')) return null;
        const match = mileageStr.replace(/,/g, '').match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }

    function formatTitleStatus(status) {
        if (!status) return 'Unknown';
        if (status === 'clean') return 'Clean';
        if (status === 'unknown') return 'Unknown';
        return 'Salvage/Rebuilt';
    }

    function cleanCategory(category) {
        if (!category) return '—';
        return category
            .replace(/NHTSA complaints?[:\s]+\d+/gi, '')
            .replace(/\d+\s*NHTSA/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }


    // ─────────────────────────────────────────────
    // STATUS MESSAGE
    // ─────────────────────────────────────────────

    function showStatus(type, msg) {
        statusDiv.className  = type;
        statusDiv.textContent = msg;
        statusDiv.style.display = 'block';
    }
});
