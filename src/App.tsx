import { useState } from 'react';
import { Lock, Unlock, Key } from 'lucide-react';
import "./App.css";

export default function App() {
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [message, setMessage] = useState('');
    const [encryptedMessage, setEncryptedMessage] = useState('');
    const [decryptedMessage, setDecryptedMessage] = useState('');
    const [encryptInput, setEncryptInput] = useState('');
    const [decryptInput, setDecryptInput] = useState('');

    const arrayBufferToPem = (buffer: ArrayBuffer, type: string): string => {
        const base64 = btoa(
            String.fromCharCode(...new Uint8Array(buffer))
        );
        const matches = base64.match(/.{1,64}/g);
        const formatted = matches ? matches.join('\n') : base64;
        return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
    };

    const pemToArrayBuffer = (pem: string): ArrayBuffer => {
        const base64 = pem
            .replace(/-----BEGIN.*?-----/g, '')
            .replace(/-----END.*?-----/g, '')
            .replace(/\s/g, '');
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const generateKeys = async () => {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            const exportedPublicKey = await window.crypto.subtle.exportKey(
                "spki",
                keyPair.publicKey
            );
            const exportedPrivateKey = await window.crypto.subtle.exportKey(
                "pkcs8",
                keyPair.privateKey
            );

            setPublicKey(arrayBufferToPem(exportedPublicKey, 'PUBLIC KEY'));
            setPrivateKey(arrayBufferToPem(exportedPrivateKey, 'PRIVATE KEY'));
            setEncryptedMessage('');
            setDecryptedMessage('');
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            alert('Error generating keys: ' + message);
        }
    };

    const encryptMessage = async () => {
        if (!message || !encryptInput) {
            alert('Please enter both a message and a public key');
            return;
        }

        try {
            const publicKeyBuffer = pemToArrayBuffer(encryptInput);
            const importedPublicKey = await window.crypto.subtle.importKey(
                "spki",
                publicKeyBuffer,
                { name: "RSA-OAEP", hash: "SHA-256" },
                true,
                ["encrypt"]
            );

            const data = new TextEncoder().encode(message);
            const encrypted = await window.crypto.subtle.encrypt(
                { name: "RSA-OAEP" },
                importedPublicKey,
                data
            );

            setEncryptedMessage(
                btoa(String.fromCharCode(...new Uint8Array(encrypted)))
            );
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            alert('Error encrypting message: ' + message);
        }
    };

    const decryptMessage = async () => {
        if (!decryptInput || !privateKey) {
            alert('Please enter both an encrypted message and your private key');
            return;
        }

        try {
            const privateKeyBuffer = pemToArrayBuffer(privateKey);
            const importedPrivateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                privateKeyBuffer,
                { name: "RSA-OAEP", hash: "SHA-256" },
                true,
                ["decrypt"]
            );

            const encryptedData = Uint8Array.from(
                atob(decryptInput),
                c => c.charCodeAt(0)
            );

            const decrypted = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                importedPrivateKey,
                encryptedData
            );

            setDecryptedMessage(new TextDecoder().decode(decrypted));
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            alert('Error decrypting message: ' + message);
        }
    };

    return (
        <div className="app">
            <div className="container">
                <header className="header">
                    <h1 className="title">RSA Message Encryptor</h1>
                    <p className="subtitle">
                        Securely encrypt and decrypt messages using RSA encryption
                    </p>
                </header>

                <section className="card">
                    <div className="card-header">
                        <h2 className="section-title">
                            <Key /> Step 1: Generate Keys
                        </h2>
                        <button onClick={generateKeys} className="btn primary">
                            Generate New Keys
                        </button>
                    </div>

                    {publicKey && (
                        <div className="stack">
                            <div className="field">
                                <label>Public Key</label>
                                <textarea
                                    className="textarea key"
                                    readOnly
                                    rows={6}
                                    value={publicKey}
                                />
                            </div>

                            <div className="field">
                                <label>Private Key (DONT SHARE YOUR PRIVATE KEY!!!!!)</label>
                                <textarea
                                    className="textarea key"
                                    readOnly
                                    rows={6}
                                    value={privateKey}
                                />
                            </div>
                        </div>
                    )}
                </section>

                <section className="card">
                    <h2 className="section-title">
                        <Lock /> Step 2: Encrypt
                    </h2>
                    <textarea
                        className="textarea"
                        rows={3}
                        value={message}
                        placeholder="PASTE YOUR MESSAGE HERE"
                        onChange={e => setMessage(e.target.value)}
                    />
                    <textarea
                        className="textarea key"
                        rows={4}
                        value={encryptInput}
                        placeholder="PASTE RECIPIENT'S PUBLIC KEY"
                        onChange={e => setEncryptInput(e.target.value)}
                    />
                    <button onClick={encryptMessage} className="btn success full">
                        Encrypt
                    </button>
                    {encryptedMessage && (
                        <textarea
                            className="textarea encrypted"
                            readOnly
                            rows={4}
                            value={encryptedMessage}
                        />
                    )}
                </section>

                <section className="card">
                    <h2 className="section-title">
                        <Unlock /> Step 3: Decrypt
                    </h2>
                    <textarea
                        className="textarea key"
                        rows={4}
                        value={decryptInput}
                        placeholder="PASTE YOUR ENCRYPTED MESSAGE"
                        onChange={e => setDecryptInput(e.target.value)}
                    />
                    <button onClick={decryptMessage} className="btn primary full">
                        Decrypt
                    </button>
                    {decryptedMessage && (
                        <div className="output">{decryptedMessage}</div>
                    )}
                </section>
            </div>
        </div>
    );
}
