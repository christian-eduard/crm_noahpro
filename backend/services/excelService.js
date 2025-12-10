// Lazy load ExcelJS to prevent blocking startup
let ExcelJS = null;
const loadExcelJS = () => {
    if (!ExcelJS) {
        ExcelJS = require('exceljs');
    }
    return ExcelJS;
};
const path = require('path');
const fs = require('fs');

const generateLeadsExcel = async (leads) => {
    try {
        const ExcelJSModule = loadExcelJS();
        const workbook = new ExcelJSModule.Workbook();
        const worksheet = workbook.addWorksheet('Leads');

        // Define columns
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Teléfono', key: 'phone', width: 15 },
            { header: 'Empresa', key: 'business_name', width: 25 },
            { header: 'Estado', key: 'status', width: 15 },
            { header: 'Fuente', key: 'source', width: 15 },
            { header: 'Mensaje', key: 'message', width: 40 },
            { header: 'Fecha Creación', key: 'created_at', width: 20 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF667eea' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;

        // Add data
        leads.forEach(lead => {
            const row = worksheet.addRow({
                id: lead.id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone || 'N/A',
                business_name: lead.business_name || 'N/A',
                status: getStatusLabel(lead.status),
                source: lead.source || 'web',
                message: lead.message || 'Sin mensaje',
                created_at: new Date(lead.created_at).toLocaleDateString('es-ES')
            });

            // Alternate row colors
            if (row.number % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF7FAFC' }
                };
            }

            // Status color coding
            const statusCell = row.getCell('status');
            switch (lead.status) {
                case 'new':
                    statusCell.font = { color: { argb: 'FF2563EB' } };
                    break;
                case 'contacted':
                    statusCell.font = { color: { argb: 'FFD97706' } };
                    break;
                case 'qualified':
                    statusCell.font = { color: { argb: 'FF9333EA' } };
                    break;
                case 'proposal_sent':
                    statusCell.font = { color: { argb: 'FFEA580C' } };
                    break;
                case 'won':
                    statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
                    break;
                case 'lost':
                    statusCell.font = { color: { argb: 'FFDC2626' } };
                    break;
            }
        });

        // Add borders to all cells
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };
            });
        });

        // Add summary at the bottom
        const summaryRow = worksheet.addRow([]);
        summaryRow.getCell(1).value = 'RESUMEN';
        summaryRow.getCell(1).font = { bold: true };
        summaryRow.getCell(2).value = `Total Leads: ${leads.length}`;

        const statusCounts = leads.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {});

        let summaryRowNum = summaryRow.number + 1;
        Object.entries(statusCounts).forEach(([status, count]) => {
            const row = worksheet.getRow(summaryRowNum++);
            row.getCell(2).value = `${getStatusLabel(status)}: ${count}`;
        });

        // Generate file
        const fileName = `leads_export_${Date.now()}.xlsx`;
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const filePath = path.join(tempDir, fileName);

        await workbook.xlsx.writeFile(filePath);

        return { filePath, fileName };
    } catch (error) {
        throw error;
    }
};

const getStatusLabel = (status) => {
    const labels = {
        new: 'Nuevo',
        contacted: 'Contactado',
        qualified: 'Cualificado',
        proposal_sent: 'Propuesta Enviada',
        won: 'Ganado',
        lost: 'Perdido'
    };
    return labels[status] || status;
};

module.exports = { generateLeadsExcel };
