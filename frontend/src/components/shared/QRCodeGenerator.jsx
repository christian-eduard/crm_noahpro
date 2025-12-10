import React from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ data, size = 200, className = '' }) => {
    const [qrDataUrl, setQrDataUrl] = React.useState('');

    React.useEffect(() => {
        if (data) {
            QRCode.toDataURL(data, { width: size, margin: 1 })
                .then(url => setQrDataUrl(url))
                .catch(err => console.error('Error generating QR:', err));
        }
    }, [data, size]);

    if (!qrDataUrl) return null;

    return (
        <img
            src={qrDataUrl}
            alt="QR Code"
            width={size}
            height={size}
            className={className}
        />
    );
};

export default QRCodeGenerator;
