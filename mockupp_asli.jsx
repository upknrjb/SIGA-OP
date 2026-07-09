import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin, Activity, AlertTriangle, Camera, Play, CheckCircle,
    Map as MapIcon, FileText, Video, Crosshair, FileSignature, Clock,
    ChevronDown, ChevronUp, User, X, FileSpreadsheet, Download,
    Smartphone, Monitor, Plus, Minus, Trash2, Calendar, Printer, Eye,
    Shield, Lock, LogOut, ArrowRight, Upload,
    CloudOff, Trophy, Megaphone, Pen, Droplet, CloudLightning,
    History, Send, BarChart3, Wrench,
    ListFilter, Menu, ChevronRight, ChevronLeft, ExternalLink,
    Moon, Sun, Loader2, MessageCircle, Sparkles, Image as ImageIcon
} from 'lucide-react';

// ==========================================
// 1. DATA MASTER & UTILITIES
// ==========================================
const DAERAH_IRIGASI_MASTER = [
    { id: 'di1', name: "DI Paneki", lat: -0.9412, lng: 119.8921 },
    { id: 'di2', name: "DI Kekeloe", lat: -1.0215, lng: 119.9872 },
    { id: 'di3', name: "DI Dolago", lat: -0.8502, lng: 120.0891 },
    { id: 'di4', name: "DI Gumbasa", lat: -1.1565, lng: 119.9320 },
    { id: 'di5', name: "DI Kolondom", lat: 1.0987, lng: 120.8012 }
];

const JABATAN_LIST = ["Juru", "PPA", "POB", "Staf Pengamat", "Pengamat"];

const PEGAWAI_STATUS = [
    { id: 1, name: 'Nur Muhammad Taufik', jabatan: 'PPA', wilayah: 'DI Kolondom', nip: '200006232025041002', excel: true, totalRuasTarget: 2, whatsapp: '081234567890', ruasData: [{ namaRuas: 'Primer Kolondom', pel: 'lengkap', pem: 'lengkap', ber: 'lengkap' }] },
    { id: 2, name: 'Budi Santoso', jabatan: 'Juru', wilayah: 'DI Paneki', nip: '198111032025211069', excel: false, totalRuasTarget: 2, whatsapp: '085211223344', ruasData: [{ namaRuas: 'Sekunder Kanan', pel: 'belum', pem: 'sebagian', ber: 'lengkap' }] },
    { id: 3, name: 'Andi Saputra', jabatan: 'POB', wilayah: 'DI Gumbasa', nip: '199002122020121004', excel: false, totalRuasTarget: 1, whatsapp: '081344556677', ruasData: [] },
    { id: 4, name: 'Siti Aminah', jabatan: 'PPA', wilayah: 'DI Kekeloe', nip: '199505052022032011', excel: true, totalRuasTarget: 2, whatsapp: '082233445566', ruasData: [{ namaRuas: 'Pintu Air 2', pel: 'lengkap', pem: 'lengkap', ber: 'lengkap' }, { namaRuas: 'Tersier', pel: 'lengkap', pem: 'lengkap', ber: 'lengkap' }] }
];

const generateMockFeeds = () => {
    const feeds = [];
    const types = ['Pelumasan', 'Pemarasan', 'Pembersihan Sampah', 'Inspeksi Tanggul'];
    for (let i = 1; i <= 15; i++) {
        feeds.push({ id: i, lat: -0.9412 + (Math.random() * 0.5 - 0.25), lng: 119.8921 + (Math.random() * 0.5 - 0.25), progress: i % 3 === 0 ? 100 : 50, type: types[i % types.length], location: `DI Paneki - Saluran ${i}`, time: `${i * 2} mnt lalu`, user: 'Petugas' });
    }
    return feeds;
};
const LIVE_FEEDS = generateMockFeeds();

const ANOMALIES = [
    { id: 1, type: "Integrasi BERANI", msg: "Aduan warga: Tumpukan sampah menyumbat Pintu Air DI Gumbasa.", action: "Buat SPK Tiket", status: 'open' },
    { id: 2, type: "High Risk", msg: "Klaim Pembersihan 100% di DI Paneki tanpa unggahan visual > 30 hari.", action: "Kirim Teguran", status: 'open' }
];

const MOCK_HOLIDAYS = { '2026-05-01': 'Hari Buruh', '2026-05-14': 'Kenaikan Yesus Kristus' };

const calculateDILeaderboard = () => {
    return DAERAH_IRIGASI_MASTER.map(di => {
        const emps = PEGAWAI_STATUS.filter(p => p.wilayah === di.name);
        const total = emps.length;
        const tuntas = emps.filter(p => {
            const isTargetedRole = ['PPA', 'POB'].includes(p.jabatan);
            const isAllRuasLengkap = p.ruasData.length > 0 && p.ruasData.every(r => r.pel === 'lengkap' && r.pem === 'lengkap' && r.ber === 'lengkap');
            return p.excel && (isTargetedRole ? isAllRuasLengkap : p.ruasData.length > 0);
        }).length;
        return { name: di.name, score: total > 0 ? Math.round((tuntas / total) * 100) : 0, pegawai: total, tuntas: tuntas };
    }).sort((a, b) => b.score - a.score);
};

const generateWAMessage = (p) => {
    let missingItems = [];
    if (!p.excel) missingItems.push("▪️ Laporan E-Kinerja (Buku Harian Excel)");
    if (['PPA', 'POB'].includes(p.jabatan)) {
        if (p.ruasData.length === 0) {
            missingItems.push("▪️ Semua Video Visual Pekerjaan Fisik");
        } else {
            p.ruasData.forEach(r => {
                let missingVids = [];
                if (r.pel !== 'lengkap') missingVids.push('Pelumasan');
                if (r.pem !== 'lengkap') missingVids.push('Pemarasan');
                if (r.ber !== 'lengkap') missingVids.push('Pembersihan');
                if (missingVids.length > 0) missingItems.push(`▪️ Video Visual pada ${r.namaRuas} (${missingVids.join(', ')})`);
            });
            if (p.ruasData.length < p.totalRuasTarget) missingItems.push(`▪️ Masih kurang pelaporan di ${p.totalRuasTarget - p.ruasData.length} lokasi/ruas target`);
        }
    } else {
        if (p.ruasData.length === 0) missingItems.push("▪️ Video Bukti Inspeksi Lapangan");
    }
    const text = `Halo Bapak/Ibu *${p.name}*,\n\nMengingatkan bahwa laporan kinerja Anda di wilayah *${p.wilayah}* untuk periode ini terpantau *BELUM LENGKAP* pada sistem SIGA OP SDA.\n\nBerikut rincian laporan yang perlu dilengkapi:\n${missingItems.join('\n')}\n\nMohon untuk segera melengkapinya melalui aplikasi. Terima kasih. 🙏`;
    return encodeURIComponent(text);
};


// ==========================================
// 2. KOMPONEN KECIL & MODAL
// ==========================================

function MenuBtn({ icon, label, active, onClick, badge }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-blue-50 dark:bg-teal-500/10 text-[#174b6f] dark:text-teal-400 font-bold border border-blue-100 dark:border-teal-500/20 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            {icon}
            <span className="text-sm flex-1 text-left tracking-wide">{label}</span>
            {badge > 0 && <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">{badge}</span>}
        </button>
    );
}

function LoginModal({ onClose, onLogin }) {
    const [selectedRole, setSelectedRole] = useState('petugas');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => { setIsLoading(false); onLogin(selectedRole); }, 800);
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div><h3 className="text-xl font-black dark:text-white uppercase"><Lock className="w-5 h-5 inline mr-2 text-[#174b6f] dark:text-teal-400" /> Otorisasi</h3></div>
                    <button onClick={onClose} className="p-1 text-slate-400 cursor-pointer"><X className="pointer-events-none" /></button>
                </div>
                <form onSubmit={handleLogin} className="p-8 space-y-6">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">NIP</label>
                        <input type="text" required disabled={isLoading} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-4 font-bold dark:text-white outline-none focus:border-[#174b6f]" placeholder="Masukkan NIP" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Kata Sandi (Password)</label>
                        <input type="password" required disabled={isLoading} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-4 font-bold dark:text-white outline-none focus:border-[#174b6f]" placeholder="••••••••" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button type="button" onClick={() => setSelectedRole('petugas')} className={`py-3 rounded-xl text-xs font-bold border uppercase transition cursor-pointer ${selectedRole === 'petugas' ? 'bg-blue-50 border-[#174b6f] text-[#174b6f] dark:bg-teal-900/30 dark:border-teal-400 dark:text-teal-400' : 'dark:border-slate-700 text-slate-400'}`}>Petugas</button>
                        <button type="button" onClick={() => setSelectedRole('admin')} className={`py-3 rounded-xl text-xs font-bold border uppercase transition cursor-pointer ${selectedRole === 'admin' ? 'bg-blue-50 border-[#174b6f] text-[#174b6f] dark:bg-teal-900/30 dark:border-teal-400 dark:text-teal-400' : 'dark:border-slate-700 text-slate-400'}`}>Admin</button>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full h-14 bg-[#174b6f] dark:bg-teal-600 text-white font-black rounded-xl uppercase tracking-widest shadow-xl flex items-center justify-center border-b-4 border-blue-900 active:border-b-0 disabled:opacity-75 cursor-pointer">
                        {isLoading ? <Loader2 className="animate-spin" /> : "MASUK"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function CameraSimulator({ onClose, onSave }) {
    const [recording, setRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(20);
    const timerRef = useRef(null);

    const startRecord = () => {
        setRecording(true);
        setTimeLeft(20);
        timerRef.current = setInterval(() => setTimeLeft(p => {
            if (p <= 1) { stopRecord(); return 0; }
            return p - 1;
        }), 1000);
    };

    const stopRecord = () => {
        setRecording(false);
        clearInterval(timerRef.current);
        setTimeout(() => onSave("blob_url"), 500);
    };

    useEffect(() => { return () => clearInterval(timerRef.current); }, []);

    return (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-fadeIn">
            <div className="p-4 flex justify-between absolute top-0 w-full z-10">
                <div className="text-white font-mono font-bold flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${recording ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    {recording ? `REC 00:${timeLeft.toString().padStart(2, '0')}` : 'READY (Maks 20s)'}
                </div>
                <button onClick={onClose} className="text-white p-2 bg-black/50 rounded-full cursor-pointer"><X className="pointer-events-none" /></button>
            </div>
            <div className="flex-1 relative flex items-center justify-center">
                <Crosshair className="text-white/30 w-24 h-24" />
                <div className="absolute bottom-6 left-6 text-[10px] font-mono text-teal-400 bg-black/60 p-3 rounded-lg border border-teal-500/30">
                    <p>SIGA OP SDA</p><p>LAT: -0.8917 LNG: 119.8707</p>
                </div>
            </div>
            <div className="h-32 flex items-center justify-center pb-8 border-t border-slate-800">
                {!recording ? (
                    <button onClick={startRecord} className="w-16 h-16 rounded-full border-4 border-white flex justify-center items-center cursor-pointer"><div className="w-12 h-12 bg-rose-600 rounded-full pointer-events-none"></div></button>
                ) : (
                    <button onClick={stopRecord} className="w-16 h-16 rounded-full border-4 border-slate-400 flex justify-center items-center cursor-pointer"><div className="w-8 h-8 bg-rose-600 rounded-sm pointer-events-none"></div></button>
                )}
            </div>
        </div>
    );
}

function VideoSlot({ progress, label, videoData, onVideoSet }) {
    const [showCamera, setShowCamera] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            onVideoSet(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className="border dark:border-slate-700 p-4 rounded-2xl flex flex-col justify-between min-h-[160px] bg-slate-50/50 dark:bg-slate-900 transition-colors shadow-sm">
            <div className="mb-4">
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{progress}</span>
                <span className="text-xs font-bold block dark:text-slate-300 mt-2">{label}</span>
            </div>

            {videoData ? (
                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-xl border dark:border-slate-600 shadow-sm">
                    <span className="text-[10px] font-bold dark:text-white flex items-center"><CheckCircle className="w-3 h-3 text-green-500 mr-1" /> OK</span>
                    <button onClick={() => onVideoSet(null)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4 pointer-events-none" /></button>
                </div>
            ) : (
                <div className="flex flex-col gap-2 mt-auto">
                    <button onClick={() => setShowCamera(true)} className="bg-[#174b6f] dark:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center shadow-md cursor-pointer">
                        <Camera className="w-4 h-4 mr-2 pointer-events-none" /> Kamera (Maks 20s)
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center shadow-sm transition cursor-pointer">
                        <Upload className="w-4 h-4 mr-2 pointer-events-none" /> Upload HP
                    </button>
                    <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </div>
            )}
            {showCamera && <CameraSimulator onClose={() => setShowCamera(false)} onSave={(data) => { onVideoSet(data); setShowCamera(false); }} />}
        </div>
    );
}

function ProfileFormModal({ userData, setUserData, onClose }) {
    const [formData, setFormData] = useState(userData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setUserData(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-5 bg-[#174b6f] dark:bg-slate-950 flex justify-between items-center">
                    <h3 className="text-lg font-black text-white uppercase flex items-center">
                        <User className="w-5 h-5 mr-2 text-teal-400" /> PENGATURAN PROFIL
                    </h3>
                    <button type="button" onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-lg transition cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Nama Pegawai</label>
                        <input type="text" name="nama" value={formData.nama} onChange={handleChange} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white outline-none focus:border-[#174b6f] dark:focus:border-teal-500 transition shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">NIP Pegawai</label>
                        <input type="text" name="nip" value={formData.nip} onChange={handleChange} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white outline-none focus:border-[#174b6f] dark:focus:border-teal-500 transition shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Jabatan</label>
                        <select name="jabatan" value={formData.jabatan} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white outline-none focus:border-[#174b6f] dark:focus:border-teal-500 transition shadow-sm">
                            {JABATAN_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">No. WhatsApp</label>
                        <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} required placeholder="08123..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white outline-none focus:border-[#174b6f] dark:focus:border-teal-500 transition shadow-sm" />
                    </div>
                    <button type="submit" className="w-full mt-4 py-3.5 bg-[#174b6f] dark:bg-teal-600 hover:bg-[#103a58] text-white font-black rounded-xl uppercase tracking-widest shadow-md transition border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 cursor-pointer">Simpan Profil</button>
                </form>
            </div>
        </div>
    );
}

function DIEmployeesModal({ diName, pegawaiList, onClose }) {
    const employees = pegawaiList.filter(p => p.wilayah === diName);

    const total = employees.length;
    const tuntasCount = employees.filter(p => {
        const isTargetedRole = ['PPA', 'POB'].includes(p.jabatan);
        const isAllRuasLengkap = p.ruasData.length > 0 && p.ruasData.every(r => r.pel === 'lengkap' && r.pem === 'lengkap' && r.ber === 'lengkap');
        return p.excel && (isTargetedRole ? isAllRuasLengkap : p.ruasData.length > 0);
    }).length;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 bg-[#174b6f] dark:bg-slate-950 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase flex items-center"><MapIcon className="w-5 h-5 mr-2 text-teal-400" /> DETAIL {diName}</h3>
                        <p className="text-[10px] text-blue-200 mt-1 font-bold tracking-widest">{tuntasCount} dari {total} Pegawai Tuntas</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-900 space-y-4">
                    {employees.length === 0 ? (
                        <p className="text-center py-10 text-slate-500 font-bold uppercase">Belum ada pegawai ditugaskan</p>
                    ) : (
                        employees.map(p => {
                            const isTargetedRole = ['PPA', 'POB'].includes(p.jabatan);
                            const isAllRuasLengkap = p.ruasData.length > 0 && p.ruasData.every(r => r.pel === 'lengkap' && r.pem === 'lengkap' && r.ber === 'lengkap');
                            const isTargetMet = p.ruasData.length >= p.totalRuasTarget;
                            const isLengkap = p.excel && (isTargetedRole ? (isAllRuasLengkap && isTargetMet) : p.ruasData.length > 0);

                            const waNumber = p.whatsapp.startsWith('0') ? '62' + p.whatsapp.substring(1) : p.whatsapp;
                            const waLink = `https://wa.me/${waNumber}?text=${generateWAMessage(p)}`;

                            return (
                                <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0"><User className="w-6 h-6" /></div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white text-sm">{p.name}</h4>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{p.jabatan}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isLengkap ? (
                                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-black border border-emerald-100">TUNTAS</span>
                                        ) : (
                                            <>
                                                <a href={waLink} target="_blank" rel="noopener noreferrer" title="Ingatkan via WhatsApp" className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-teal-400 border border-emerald-200 dark:border-emerald-800 rounded-lg transition hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-sm flex items-center justify-center text-[9px] font-black uppercase">
                                                    <MessageCircle className="w-3.5 h-3.5 mr-1" /> Ingatkan
                                                </a>
                                                <span className="text-[9px] bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg font-black border border-rose-100 whitespace-nowrap">BELUM LENGKAP</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function VideoKompilasiModal({ pegawai, onClose }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);

    const frames = [
        { title: "PELUMASAN PINTU AIR (0%)", loc: "Primer Kolondom", time: "2026-05-02 08:15:00" },
        { title: "PELUMASAN PINTU AIR (50%)", loc: "Primer Kolondom", time: "2026-05-02 08:30:00" },
        { title: "PELUMASAN PINTU AIR (100%)", loc: "Primer Kolondom", time: "2026-05-02 08:45:00" },
        { title: "PEMARASAN TANGGUL (0%)", loc: "Primer Kolondom", time: "2026-05-02 09:00:00" },
        { title: "PEMARASAN TANGGUL (100%)", loc: "Primer Kolondom", time: "2026-05-02 09:30:00" }
    ];

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentFrame((prev) => {
                    if (prev >= frames.length - 1) { setIsPlaying(false); return 0; }
                    return prev + 1;
                });
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    return (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 flex flex-col p-4 sm:p-8 animate-fadeIn overflow-auto items-center justify-center">
            <div className="bg-slate-900 py-3 px-5 mb-4 rounded-xl border border-slate-700 w-full max-w-4xl flex justify-between items-center shadow-lg">
                <h2 className="text-white font-bold flex items-center"><Video className="w-5 h-5 mr-2 text-teal-400" /> Pratinjau Kompilasi Video</h2>
                <div className="flex gap-2">
                    <button className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-white transition flex items-center text-xs font-bold uppercase tracking-wider shadow-sm"><Download className="w-4 h-4 mr-2" /> Unduh Video (.mp4)</button>
                    <button onClick={onClose} className="bg-slate-800 hover:bg-rose-500 p-2 rounded-lg text-white transition ml-2 border border-slate-600"><X className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-slate-700 aspect-video flex flex-col">
                {!isPlaying ? (
                    <div className="w-full h-full bg-[#0a192f] text-white p-8 relative flex flex-col justify-center">
                        <div className="absolute top-8 left-8 flex items-center gap-4">
                            <div className="w-16 h-20 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center p-2"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Coat_of_arms_of_Central_Sulawesi.svg/200px-Coat_of_arms_of_Central_Sulawesi.svg.png" className="h-full object-contain" alt="Logo" /></div>
                            <h2 className="text-xl md:text-2xl font-black uppercase leading-snug drop-shadow-lg">Dinas Cipta Karya dan Sumber Daya Air<br />Provinsi Sulawesi Tengah</h2>
                        </div>
                        <div className="flex w-full items-end justify-between mt-24">
                            <div className="flex-1 text-base md:text-xl space-y-3 font-semibold uppercase tracking-wider">
                                <div className="grid grid-cols-[150px_auto] gap-2"><span className="text-blue-300">NAMA</span><span>: {pegawai.name}</span></div>
                                <div className="grid grid-cols-[150px_auto] gap-2"><span className="text-blue-300">NIP</span><span>: {pegawai.nip || '200006232025041002'}</span></div>
                                <div className="grid grid-cols-[150px_auto] gap-2"><span className="text-blue-300">JABATAN</span><span>: {pegawai.jabatan}</span></div>
                                <div className="grid grid-cols-[150px_auto] gap-2"><span className="text-blue-300">D.I</span><span>: {pegawai.wilayah.replace('DI ', '')}</span></div>
                            </div>
                            <div className="w-32 h-40 md:w-48 md:h-64 bg-slate-800 border-4 border-white shadow-2xl overflow-hidden rounded"><div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-900"><User className="w-16 h-16 opacity-50" /></div></div>
                        </div>
                        <div className="absolute bottom-8 left-0 right-0 text-center"><h1 className="text-3xl md:text-5xl font-black text-yellow-400 tracking-widest drop-shadow-md">MEI - 2026</h1></div>
                        <button onClick={() => setIsPlaying(true)} className="absolute inset-0 m-auto w-20 h-20 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10"><Play className="w-10 h-10 text-white ml-2" /></button>
                    </div>
                ) : (
                    <div className="w-full h-full bg-slate-900 relative flex items-center justify-center">
                        <div className="text-slate-600 animate-pulse"><Video className="w-32 h-32 opacity-20" /></div>
                        <div className="absolute inset-x-0 bottom-10 px-10">
                            <div className="bg-black/60 p-4 rounded-lg border-2 border-white/20 inline-block backdrop-blur-md">
                                <h3 className="text-white font-black text-xl mb-1">{frames[currentFrame].title}</h3>
                                <p className="text-yellow-400 font-mono text-sm font-bold">LOKASI: {frames[currentFrame].loc} | GPS: -0.9412, 119.8921</p>
                                <p className="text-white font-mono text-xs">{frames[currentFrame].time}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AdminEksekutifPreview({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col p-4 sm:p-8 animate-fadeIn overflow-auto items-center">
            <div className="bg-slate-900 py-3 px-5 mb-4 rounded-xl border border-slate-700 w-full max-w-4xl flex justify-between items-center">
                <h2 className="text-white font-bold flex items-center"><FileSignature className="w-5 h-5 mr-2 text-teal-400" /> Preview PDF Eksekutif</h2>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white transition flex items-center text-xs font-bold uppercase tracking-wider shadow-sm"><Printer className="w-4 h-4 mr-2" /> Cetak Dokumen</button>
                    <button className="bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-lg text-white transition flex items-center text-xs font-bold uppercase tracking-wider shadow-sm"><Download className="w-4 h-4 mr-2" /> Unduh PDF</button>
                    <button onClick={onClose} className="bg-slate-800 hover:bg-rose-500 p-2 rounded-lg text-white transition ml-2 border border-slate-600"><X className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="bg-white text-black p-10 sm:p-14 shadow-2xl mx-auto w-full max-w-4xl min-h-[1000px] flex flex-col relative shrink-0">
                <div className="border-b-4 border-double border-black pb-6 mb-8 text-center">
                    <h1 className="font-black text-2xl uppercase tracking-wider mb-2">Laporan Eksekutif Pemantauan Infrastruktur SDA</h1>
                    <h2 className="font-bold text-lg uppercase tracking-wider text-slate-700">Dinas Cipta Karya Dan Sumber Daya Air Provinsi Sulawesi Tengah</h2>
                </div>
                <div className="space-y-8">
                    <section>
                        <h3 className="font-bold text-lg mb-3 bg-slate-200 px-3 py-1 border-l-4 border-blue-600">A. Ringkasan Kepatuhan Pegawai</h3>
                        <div className="flex justify-between mb-4 px-4 border border-slate-200 p-4 rounded-xl bg-slate-50">
                            <div className="text-center"><p className="text-3xl font-black text-blue-600">{PEGAWAI_STATUS.length}</p><p className="text-xs uppercase font-bold text-slate-500">Total Pegawai</p></div>
                            <div className="text-center"><p className="text-3xl font-black text-emerald-600">{PEGAWAI_STATUS.filter(p => p.excel).length}</p><p className="text-xs uppercase font-bold text-slate-500">Laporan Excel Masuk</p></div>
                            <div className="text-center"><p className="text-3xl font-black text-rose-600">{PEGAWAI_STATUS.filter(p => !p.excel).length}</p><p className="text-xs uppercase font-bold text-slate-500">Pegawai Belum Lapor</p></div>
                        </div>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg mb-3 bg-slate-200 px-3 py-1 border-l-4 border-yellow-500">B. Status Anomali (Sistem Teguran )</h3>
                        <ul className="list-disc pl-6 space-y-3 text-sm text-justify">
                            {ANOMALIES.map(anom => (
                                <li key={anom.id} className="pb-2 border-b border-slate-100">
                                    <strong className="uppercase bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] mr-2">[{anom.type}]</strong> {anom.msg}
                                    <br /><span className="text-slate-500 text-xs italic mt-1 inline-block">Tindak Lanjut: {anom.action}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}

function AdminRekapPreview({ onClose, pegawaiList }) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col p-4 sm:p-8 animate-fadeIn overflow-auto items-center">
            <div className="bg-slate-900 py-3 px-5 mb-4 rounded-xl border border-slate-700 w-full max-w-4xl flex justify-between items-center">
                <h2 className="text-white font-bold flex items-center"><FileSpreadsheet className="w-5 h-5 mr-2 text-teal-400" /> Preview Excel Rekapitulasi</h2>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white transition flex items-center text-xs font-bold uppercase tracking-wider shadow-sm"><Printer className="w-4 h-4 mr-2" /> Cetak Tabel</button>
                    <button className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-white transition flex items-center text-xs font-bold uppercase tracking-wider shadow-sm"><Download className="w-4 h-4 mr-2" /> Unduh .XLSX</button>
                    <button onClick={onClose} className="bg-slate-800 hover:bg-rose-500 p-2 rounded-lg text-white transition ml-2 border border-slate-600"><X className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="bg-white text-black p-10 shadow-2xl mx-auto w-full max-w-4xl min-h-[500px] flex flex-col relative shrink-0">
                <h1 className="font-black text-xl uppercase mb-8 text-center border-b-2 border-slate-400 pb-4">Rekapitulasi Kepatuhan Laporan Kinerja & Visual</h1>
                <table className="w-full border-collapse border border-slate-400 text-xs text-left">
                    <thead className="bg-slate-200 font-bold border-b-2 border-slate-400">
                        <tr>
                            <th className="border border-slate-400 p-3 w-10 text-center">No</th>
                            <th className="border border-slate-400 p-3">Nama Pegawai</th>
                            <th className="border border-slate-400 p-3">Jabatan</th>
                            <th className="border border-slate-400 p-3 text-center">E-Kinerja</th>
                            <th className="border border-slate-400 p-3 text-center">Video Visual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pegawaiList.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition">
                                <td className="border border-slate-400 p-3 text-center">{idx + 1}</td>
                                <td className="border border-slate-400 p-3 font-bold">{p.name}</td>
                                <td className="border border-slate-400 p-3 uppercase text-[10px] text-slate-500">{p.jabatan}</td>
                                <td className="border border-slate-400 p-3 text-center">{p.excel ? <span className="text-emerald-600 font-black">SUDAH</span> : <span className="text-rose-600 font-black">BELUM</span>}</td>
                                <td className="border border-slate-400 p-3 text-center">{p.ruasData.length > 0 ? <span className="text-emerald-600 font-black">{p.ruasData.length} Video Terunggah</span> : <span className="text-rose-600 font-black">BELUM ADA</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ExcelPreviewModal({ userData, periode, activities, onClose }) {
    const getBulanTahun = (ym) => {
        if (!ym) return { bln: '', thn: '' };
        const date = new Date(ym + '-01');
        return { bln: date.toLocaleString('id-ID', { month: 'long' }), thn: date.getFullYear() };
    };
    const { bln, thn } = getBulanTahun(periode);
    const formatHariTanggal = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex flex-col p-4 sm:p-8 animate-fadeIn overflow-auto items-center">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-3 px-5 shadow-lg z-10 rounded-xl w-full max-w-5xl">
                <h2 className="text-slate-800 font-black flex items-center"><Printer className="w-5 h-5 mr-2" /> PRATINJAU DOKUMEN BUKU HARIAN</h2>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-[#174b6f] hover:bg-[#103a58] px-4 py-2 rounded-lg text-white transition flex items-center text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"><Printer className="w-4 h-4 mr-2 pointer-events-none" /> Cetak Dokumen</button>
                    <button className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-white transition flex items-center text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"><Download className="w-4 h-4 mr-2 pointer-events-none" /> Unduh PDF</button>
                    <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 ml-2 transition cursor-pointer"><X className="w-5 h-5 pointer-events-none" /></button>
                </div>
            </div>

            <div className="flex flex-col min-w-max space-y-8 pb-10 mt-2">
                {/* PAGE 1: SAMPUL */}
                <div className="bg-white text-black p-10 sm:p-14 shadow-xl mx-auto w-[1123px] max-w-none min-h-[794px] flex flex-col justify-center relative shrink-0 border border-slate-200">
                    <div className="text-center mb-16 relative">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Coat_of_arms_of_Central_Sulawesi.svg/200px-Coat_of_arms_of_Central_Sulawesi.svg.png" className="h-32 mx-auto mb-8" alt="Logo SulTeng" />
                        <h1 className="font-bold text-2xl mb-2 uppercase tracking-wider">Laporan Dan Penilaian Produktivitas Kinerja</h1>
                        <h2 className="font-bold text-2xl uppercase tracking-wider text-slate-800">Dinas Cipta Karya Dan Sumber Daya Air Daerah Provinsi Sulawesi Tengah</h2>
                    </div>
                    <div className="mt-12 text-left max-w-3xl mx-auto space-y-6 text-base font-medium">
                        <div className="grid grid-cols-[280px_auto]"><div className="font-semibold">Nama / NIP</div><div>: {userData.nama} / {userData.nip}</div></div>
                        <div className="grid grid-cols-[280px_auto]"><div className="font-semibold">Jabatan</div><div>: {userData.jabatan}</div></div>
                        <div className="grid grid-cols-[280px_auto]"><div className="font-semibold">Nama Atasan Langsung</div><div>: {userData.atasanNama}</div></div>
                        <div className="grid grid-cols-[280px_auto]"><div className="font-semibold">Jabatan Atasan Langsung</div><div>: {userData.atasanJabatan}</div></div>
                        <div className="grid grid-cols-[280px_auto]"><div className="font-semibold">Bulan</div><div>: {bln}</div></div>
                        <div className="grid grid-cols-[280px_auto]"><div className="font-semibold">Tahun</div><div>: {thn}</div></div>
                    </div>
                </div>

                {/* PAGE 2..n: TABEL HARIAN */}
                {activities.map((act, pageIndex) => {
                    const rowSpan = Math.max(act.slots.length, 1);
                    return (
                        <div key={act.id} className="bg-white text-black p-10 sm:p-12 shadow-xl mx-auto w-[1123px] max-w-none min-h-[794px] relative overflow-visible flex flex-col shrink-0 border border-slate-200">
                            <h1 className="text-center font-bold text-sm mb-8 uppercase tracking-wide">Laporan Dan Penilaian Produktivitas Kinerja</h1>

                            <div className="mb-4 text-xs font-bold space-y-1.5 flex flex-col">
                                <div className="grid grid-cols-[220px_auto]"><span>Nama / NIP</span><span>: {userData.nama} / {userData.nip}</span></div>
                                <div className="grid grid-cols-[220px_auto]"><span>Jabatan</span><span>: {userData.jabatan}</span></div>
                                <div className="grid grid-cols-[220px_auto]"><span>Nama Atasan Langsung</span><span>: {userData.atasanNama}</span></div>
                                <div className="grid grid-cols-[220px_auto]"><span>Jabatan Atasan Langsung</span><span>: {userData.atasanJabatan}</span></div>
                                <div className="grid grid-cols-[220px_auto] mt-3"><span>Hari/Tanggal</span><span>: {formatHariTanggal(act.tanggal)}</span></div>
                            </div>

                            <table className="w-full border-collapse border border-black text-[11px] text-center mb-6 mt-2">
                                <thead className="bg-[#f3f4f6] font-bold">
                                    <tr>
                                        <th className="border border-black p-2 w-[40px] align-middle" rowSpan="3">No.</th>
                                        <th className="border border-black p-2 w-[100px] align-middle" rowSpan="3">Waktu</th>
                                        <th className="border border-black p-2 min-w-[250px] align-middle" rowSpan="3">Uraian Tugas Jabatan Kinerja Proses Bulanan</th>
                                        <th className="border border-black p-2 align-middle" colSpan="4">Hasil Kinerja Proses Harian</th>
                                        <th className="border border-black p-2 w-[60px] align-middle" rowSpan="3">Nilai Akhir (%)</th>
                                        <th className="border border-black p-2 w-[60px] align-middle" rowSpan="3">Ket.</th>
                                    </tr>
                                    <tr>
                                        <th className="border border-black p-2 align-middle" colSpan="2">Kinerja Pelaksana Tugas</th>
                                        <th className="border border-black p-2 w-[70px] align-middle" rowSpan="2">Tugas Dinas Luar (%)</th>
                                        <th className="border border-black p-2 w-[90px] align-middle" rowSpan="2">Tidak Masuk Kerja atau Secara Nyata Tidak Melaksanakan Tugas (%)</th>
                                    </tr>
                                    <tr>
                                        <th className="border border-black p-2 min-w-[250px] align-middle">Uraian</th>
                                        <th className="border border-black p-2 w-[70px] align-middle">Hasil Kinerja (%)</th>
                                    </tr>
                                    <tr className="bg-slate-300/50">
                                        <th className="border border-black p-1">1</th>
                                        <th className="border border-black p-1">2</th>
                                        <th className="border border-black p-1">3</th>
                                        <th className="border border-black p-1">4</th>
                                        <th className="border border-black p-1">5</th>
                                        <th className="border border-black p-1">6</th>
                                        <th className="border border-black p-1">7</th>
                                        <th className="border border-black p-1">8</th>
                                        <th className="border border-black p-1">9</th>
                                    </tr>
                                </thead>
                                <tbody className="text-left align-top">
                                    <tr>
                                        <td className="border border-black p-3 text-center font-bold" rowSpan={rowSpan}>{pageIndex + 1}</td>
                                        <td className="border border-black p-3 text-center whitespace-nowrap">{act.slots[0]?.waktu || '-'}</td>
                                        <td className="border border-black p-4 whitespace-pre-wrap leading-relaxed" rowSpan={rowSpan}>{userData.uraianBulanan}</td>
                                        <td className="border border-black p-4 whitespace-pre-wrap leading-relaxed">{act.slots[0]?.detail || '-'}</td>
                                        <td className="border border-black p-3 text-center align-middle" rowSpan={rowSpan}>{act.hasilKinerja}</td>
                                        <td className="border border-black p-3 text-center align-middle" rowSpan={rowSpan}>{act.dl || ''}</td>
                                        <td className="border border-black p-3 text-center align-middle" rowSpan={rowSpan}>{act.tidakMasuk || ''}</td>
                                        <td className="border border-black p-3 text-center align-middle" rowSpan={rowSpan}>{act.nilaiAkhir}</td>
                                        <td className="border border-black p-3 text-center align-middle" rowSpan={rowSpan}>{act.ket || ''}</td>
                                    </tr>
                                    {act.slots.slice(1).map((slot, sIdx) => (
                                        <tr key={sIdx}>
                                            <td className="border border-black p-3 text-center whitespace-nowrap">{slot.waktu}</td>
                                            <td className="border border-black p-4 whitespace-pre-wrap leading-relaxed">{slot.detail}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-between px-20 mt-auto pb-10 text-center font-bold text-xs">
                                <div className="flex flex-col items-center">
                                    <p className="mb-2">PEJABAT PENILAI</p>
                                    {userData.ttdAtasanUrl ? <img src={userData.ttdAtasanUrl} className="h-20 object-contain my-2 mix-blend-multiply" alt="TTD" /> : <div className="h-20 my-2"></div>}
                                    <p className="uppercase underline underline-offset-2">{userData.atasanNama}</p>
                                    <p>NIP. {userData.atasanNip || '-'}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <p className="mb-2">YANG MEMBUAT LAPORAN</p>
                                    {userData.ttdPegawaiUrl ? <img src={userData.ttdPegawaiUrl} className="h-20 object-contain my-2 mix-blend-multiply" alt="TTD" /> : <div className="h-20 my-2"></div>}
                                    <p className="uppercase underline underline-offset-2">{userData.nama}</p>
                                    <p>NIP. {userData.nip}</p>
                                </div>
                            </div>
                            <div className="absolute bottom-6 right-10 text-[10px] text-gray-500 font-mono">Hal. {pageIndex + 2}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

// ==========================================
// 3. MAIN SCREENS & DASHBOARDS
// ==========================================

function LandingPage({ onLogin, isDarkMode, toggleDarkMode }) {
    const [showLogin, setShowLogin] = useState(false);
    const SIAGA_ALERTS = [
        { id: 1, type: "AWLR", location: "B.G. 1 (DI Paneki)", level: "SIAGA 2", msg: "Debit air meluap." },
        { id: 2, type: "SENSOR", location: "Bendung Utama (DI Torue)", level: "SIAGA 1", msg: "Sedimen menyumbat intake." }
    ];
    const [alertIndex, setAlertIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => { setAlertIndex((prev) => (prev + 1) % SIAGA_ALERTS.length); }, 5000);
        return () => clearInterval(timer);
    }, []);

    const currentAlert = SIAGA_ALERTS[alertIndex];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden transition-colors">
            <div className="bg-[#174b6f] dark:bg-slate-950 text-white border-b border-[#103a58] dark:border-slate-800 relative z-20 min-h-[3rem] py-2 flex items-center shadow-md transition-colors duration-300">
                <div className="max-w-7xl w-full mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] sm:text-xs font-medium tracking-wide">
                    <div key={currentAlert.id} className="flex items-center w-full sm:w-auto overflow-hidden animate-fadeIn">
                        <div className="bg-yellow-400 dark:bg-rose-500/20 text-slate-900 dark:text-rose-400 dark:border dark:border-rose-500/30 px-2.5 py-1 rounded flex items-center mr-3 shrink-0 shadow-sm font-black tracking-widest transition-colors duration-300">
                            <AlertTriangle className="w-3 h-3 mr-1.5 animate-pulse" /> {currentAlert.level}
                        </div>
                        <span className="truncate flex-1 text-blue-100 dark:text-slate-300 transition-colors duration-300">
                            <span className="text-yellow-400 dark:text-rose-400 font-black">{currentAlert.type}:</span> {currentAlert.msg} <strong className="text-white ml-1">{currentAlert.location}</strong>
                        </span>
                    </div>
                </div>
            </div>
            <nav className="relative z-10 flex items-center justify-between px-6 py-5 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#174b6f] dark:bg-teal-500/10 rounded-xl flex items-center justify-center">
                        <Droplet className="w-5 h-5 text-white dark:text-teal-400" />
                    </div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">SIGA OP</h1>
                </div>
                <button onClick={toggleDarkMode} className="p-2.5 rounded-xl border dark:border-slate-700 cursor-pointer">
                    {isDarkMode ? <Sun className="w-4 h-4 pointer-events-none" /> : <Moon className="w-4 h-4 pointer-events-none" />}
                </button>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-16 pb-10 bg-slate-50 dark:bg-slate-900">
                <h2 className="text-4xl md:text-6xl font-black mb-6 dark:text-white">Sistem Pengawasan <br className="hidden md:block" /><span className="text-[#174b6f] dark:text-teal-400">Infrastruktur Digital</span></h2>
                <p className="max-w-2xl text-slate-500 mb-10 font-medium leading-relaxed">Platform Audit Visual Geospasial, Deteksi Anomali, dan E-Kinerja terpadu.</p>
                <div className="flex gap-4 w-full max-w-lg mx-auto mb-16">
                    <button onClick={() => setShowLogin(true)} className="flex-1 h-14 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black rounded-xl shadow-lg transition border-b-4 border-yellow-600 active:border-b-0 uppercase tracking-widest text-sm cursor-pointer">
                        <Lock className="w-4 h-4 inline mr-2 pointer-events-none" /> Login Pegawai
                    </button>
                </div>
            </main>

            <div className="w-full max-w-6xl mx-auto text-left pb-20 px-6 relative z-20">
                <div className="text-center mb-10">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">Pantauan Cuaca Real-Time</h3>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Prediksi cuaca harian di wilayah Daerah Irigasi (DI).</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: 'DI Paneki', status: 'Cerah Berawan', temp: '32°C', icon: <Sun className="text-amber-500 w-8 h-8" /> },
                        { name: 'DI Gumbasa', status: 'Hujan Lebat', temp: '25°C', icon: <CloudLightning className="text-blue-500 w-8 h-8" /> },
                        { name: 'DI Torue', status: 'Hujan Sedang', temp: '27°C', icon: <Droplet className="text-blue-400 w-8 h-8" /> },
                        { name: 'DI Kasimbar', status: 'Berawan', temp: '30°C', icon: <CloudOff className="text-slate-400 w-8 h-8" /> }
                    ].map((w, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center transition-colors">
                            <div className="mb-3">{w.icon}</div>
                            <h4 className="font-bold text-slate-800 dark:text-white mb-1 uppercase tracking-wider">{w.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">{w.status}</p>
                            <p className="text-lg font-black text-[#174b6f] dark:text-teal-400 mt-2">{w.temp}</p>
                        </div>
                    ))}
                </div>
            </div>

            {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={onLogin} />}
        </div>
    );
}

function AdminVMapsDashboard({ isDarkMode }) {
    const mapRef = useRef(null);
    const tileLayerRef = useRef(null);
    const markersLayerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapMode, setMapMode] = useState('aktivitas');
    const [periodeMap, setPeriodeMap] = useState('2026-05');
    const [mapFeeds, setMapFeeds] = useState([]);

    const MOCK_BMKG_ALERTS = [
        { id: 'di1', name: 'DI Paneki', level: 'aman', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-500', desc: 'Cerah Berawan, Elevasi Air Normal', colorMarker: 'green' },
        { id: 'di2', name: 'DI Kekeloe', level: 'siaga', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-900/50', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-500', desc: 'Hujan Lebat, Debit Air Meningkat Cepat', colorMarker: 'orange' },
        { id: 'di3', name: 'DI Dolago', level: 'waspada', bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-200 dark:border-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-400', badge: 'bg-yellow-500', desc: 'Hujan Sedang, Perlu Pantauan Rutin', colorMarker: 'yellow' },
        { id: 'di4', name: 'DI Gumbasa', level: 'awas', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-900/50', text: 'text-rose-700 dark:text-rose-400', badge: 'bg-rose-500', desc: 'PERINGATAN: Potensi Tanggul Jebol / Meluap!', colorMarker: 'red' },
        { id: 'di5', name: 'DI Kolondom', level: 'aman', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-500', desc: 'Cerah, Kondisi Infrastruktur Aman', colorMarker: 'green' }
    ];

    useEffect(() => {
        const seed = parseInt(periodeMap.replace('-', '')) || 0;
        const newFeeds = [];
        const types = ['Pelumasan', 'Pemarasan', 'Pembersihan Sampah', 'Inspeksi Tanggul'];
        DAERAH_IRIGASI_MASTER.forEach((di, i) => {
            const pseudo = seed + i;
            for (let j = 0; j < 3; j++) {
                newFeeds.push({
                    id: `${i}-${j}-${pseudo}`, lat: di.lat + ((pseudo + j) % 7 * 0.005) - 0.015, lng: di.lng + ((pseudo + j) % 5 * 0.005) - 0.01, progress: (pseudo + j) % 3 === 0 ? 100 : ((pseudo + j) % 2 === 0 ? 50 : 0),
                    type: types[(pseudo + j) % types.length], location: `${di.name} - Titik ${j + 1}`, time: `${(pseudo + j) % 24 + 1} jam lalu`, user: `Petugas Area ${i + 1}`
                });
            }
        });
        setMapFeeds(newFeeds.sort(() => Math.random() - 0.5));
    }, [periodeMap]);

    useEffect(() => {
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
            const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true; script.onload = () => setMapLoaded(true); document.head.appendChild(script);
        } else { setMapLoaded(true); }
    }, []);

    useEffect(() => {
        if (mapLoaded && window.L && mapRef.current && !mapInstanceRef.current) {
            const map = window.L.map(mapRef.current).setView([-1.0500, 120.0000], 8);
            const tileUrl = isDarkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            tileLayerRef.current = window.L.tileLayer(tileUrl, { attribution: '&copy; SIGA-OP' }).addTo(map);
            markersLayerRef.current = window.L.layerGroup().addTo(map);
            mapInstanceRef.current = map;
        }
    }, [mapLoaded, isDarkMode]);

    useEffect(() => {
        if (mapLoaded && window.L && markersLayerRef.current) {
            const layer = markersLayerRef.current;
            layer.clearLayers();
            const createPulseIcon = (color) => window.L.divIcon({ className: 'custom-pulse', html: `<div style="position:relative;width:16px;height:16px;"><span style="position:absolute;width:100%;height:100%;border-radius:50%;background:${color};opacity:0.5;animation:ping 1.5s infinite"></span><span style="position:relative;width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;display:block"></span></div>`, iconSize: [16, 16] });

            if (mapMode === 'aktivitas') {
                DAERAH_IRIGASI_MASTER.forEach(di => window.L.circleMarker([di.lat, di.lng], { color: '#174b6f', fillOpacity: 0.2, radius: 8 }).addTo(layer).bindPopup(`<strong>${di.name}</strong>`));
                mapFeeds.forEach(feed => window.L.marker([feed.lat, feed.lng], { icon: createPulseIcon(feed.progress === 0 ? 'red' : feed.progress === 50 ? 'orange' : 'green') }).addTo(layer).bindPopup(`<strong>${feed.location}</strong><br/><span style="font-size: 10px;">Progress: ${feed.progress}% (${feed.type})</span>`));
            } else {
                MOCK_BMKG_ALERTS.forEach(alert => {
                    const di = DAERAH_IRIGASI_MASTER.find(d => d.id === alert.id);
                    if (di) {
                        window.L.circle([di.lat, di.lng], { color: alert.colorMarker, fillColor: alert.colorMarker, fillOpacity: 0.15, radius: alert.level === 'awas' ? 15000 : alert.level === 'siaga' ? 10000 : 5000 }).addTo(layer);
                        window.L.marker([di.lat, di.lng], { icon: createPulseIcon(alert.colorMarker) }).addTo(layer).bindPopup(`<strong>${di.name}</strong><br/><span style="text-transform:uppercase;color:${alert.colorMarker}">${alert.level}</span><br/>${alert.desc}`);
                    }
                });
            }
        }
    }, [mapFeeds, mapLoaded, mapMode]);

    useEffect(() => { if (tileLayerRef.current) tileLayerRef.current.setUrl(isDarkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'); }, [isDarkMode]);

    useEffect(() => {
        if (!document.getElementById('ping-style')) {
            const style = document.createElement('style'); style.id = 'ping-style';
            style.innerHTML = `@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } } @keyframes slideDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } } .animate-slideDown { animation: slideDown 0.4s ease-out forwards; } .dark .leaflet-popup-content-wrapper, .dark .leaflet-popup-tip { background: #1e293b !important; color: white !important; }`;
            document.head.appendChild(style);
        }
    }, []);

    return (
        <div className="space-y-6 h-full pb-10 flex flex-col animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-colors duration-300">
                <div>
                    <h2 className="font-black text-slate-800 dark:text-white text-lg flex items-center tracking-wide"><MapIcon className="w-5 h-5 mr-2 text-[#174b6f] dark:text-teal-400" /> PETA GEOSPASIAL</h2>
                    <p className="text-xs text-slate-500 mt-1">Sistem informasi geografis & peringatan dini bencana.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                        <button onClick={() => setMapMode('aktivitas')} className={`flex-1 sm:flex-none px-4 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all uppercase tracking-widest ${mapMode === 'aktivitas' ? 'bg-white dark:bg-slate-800 shadow text-[#174b6f] dark:text-teal-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Aktivitas Laporan</button>
                        <button onClick={() => setMapMode('bencana')} className={`flex-1 sm:flex-none px-4 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all uppercase tracking-widest flex items-center justify-center ${mapMode === 'bencana' ? 'bg-rose-500 text-white shadow' : 'text-slate-500 hover:text-rose-500 dark:hover:text-rose-400'}`}><CloudLightning className="w-3.5 h-3.5 mr-1.5" /> Sensor BMKG</button>
                    </div>
                    {mapMode === 'aktivitas' && (
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 w-full sm:w-auto transition animate-fadeIn">
                            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                            <div className="flex flex-col flex-1">
                                <span className="text-[9px] uppercase text-slate-400 dark:text-slate-500 font-bold leading-none mb-1 tracking-wider">Periode</span>
                                <input type="month" value={periodeMap} onChange={e => setPeriodeMap(e.target.value)} className="bg-transparent text-sm text-slate-800 dark:text-white font-bold outline-none cursor-pointer w-full [color-scheme:light] dark:[color-scheme:dark]" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-[500px]">
                <div className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 overflow-hidden shadow-sm relative h-[400px] xl:h-auto z-10">
                    <div className="absolute top-4 right-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl shadow-md transition-all duration-500">
                        <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-300 mb-2.5 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Legenda Peta</h3>
                        {mapMode === 'aktivitas' ? (
                            <div className="space-y-2 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#174b6f] dark:bg-teal-600 mr-2.5 shadow-sm"></div> Titik Pusat DI</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-rose-500 mr-2.5 shadow-sm"></div> Belum Dikerjakan (0%)</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-400 mr-2.5 shadow-sm"></div> Dalam Proses (50%)</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-teal-400 mr-2.5 shadow-sm"></div> Selesai Tuntas (100%)</div>
                            </div>
                        ) : (
                            <div className="space-y-2 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2.5 shadow-sm"></div> Normal / Kondusif</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-400 mr-2.5 shadow-sm"></div> Waspada Cuaca</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500 mr-2.5 shadow-sm"></div> Siaga Bencana</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-600 mr-2.5 shadow-sm animate-pulse"></div> Awas / Kritis</div>
                            </div>
                        )}
                    </div>
                    {!mapLoaded && <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 font-bold text-sm"><Loader2 className="animate-spin mr-2" /> Memuat Peta...</div>}
                    <div ref={mapRef} className="w-full h-full bg-slate-100 dark:bg-slate-900"></div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm flex flex-col min-h-[300px]">
                    <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="font-black dark:text-white text-sm flex items-center uppercase tracking-widest">
                            {mapMode === 'aktivitas' ? <><Activity className="w-4 h-4 mr-2 text-[#174b6f] dark:text-teal-400" /> Aktivitas Lapangan</> : <><CloudLightning className="w-4 h-4 mr-2 text-rose-500" /> Notifikasi BMKG</>}
                        </h3>
                    </div>
                    <div className="flex-1 p-5 overflow-y-auto space-y-4">
                        {mapMode === 'aktivitas' ? (
                            mapFeeds.slice(0, 6).map((feed, idx) => (
                                <div key={idx} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-700 pb-2">
                                    <div className={`absolute -left-[7px] top-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${feed.progress === 0 ? 'bg-rose-500' : feed.progress === 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-700 text-[11px] shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <strong className="text-[#174b6f] dark:text-teal-400">{feed.user}</strong>
                                            <p className="text-[9px] text-slate-400 font-bold">{feed.time}</p>
                                        </div>
                                        <p className="dark:text-slate-500 font-medium">Progress <strong>{feed.progress}%</strong> {feed.type} di {feed.location}.</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            MOCK_BMKG_ALERTS.map((alert, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border ${alert.border} ${alert.bg} shadow-sm animate-fadeIn`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <strong className={`${alert.text} text-xs font-black uppercase`}>{alert.name}</strong>
                                        <span className={`text-[9px] ${alert.badge} text-white px-2 py-0.5 rounded font-black uppercase tracking-wider`}>{alert.level}</span>
                                    </div>
                                    <p className={`text-[10px] font-medium ${alert.text}`}>{alert.desc}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminEvaluasiDashboard() {
    const [filterJabatan, setFilterJabatan] = useState('');
    const [filterDI, setFilterDI] = useState('');
    const [showRekapModal, setShowRekapModal] = useState(false);
    const [showEksekutifModal, setShowEksekutifModal] = useState(false);
    const [selectedDIModal, setSelectedDIModal] = useState(null);
    const [selectedVideoModal, setSelectedVideoModal] = useState(null);
    const [periodeTabel, setPeriodeTabel] = useState('2026-05');

    const leaderboardData = calculateDILeaderboard();
    const filteredPegawai = PEGAWAI_STATUS.filter(p => (filterJabatan === '' || p.jabatan === filterJabatan) && (filterDI === '' || p.wilayah === filterDI));

    return (
        <div className="space-y-6 h-full pb-10 animate-fadeIn flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700 shadow-sm gap-4">
                <div>
                    <h2 className="font-black text-slate-800 dark:text-white text-base md:text-lg flex items-center tracking-wide">
                        <BarChart3 className="w-5 h-5 mr-2 text-[#174b6f] dark:text-teal-400" /> REKAPITULASI KINERJA
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-medium">Ringkasan performa Daerah Irigasi berdasarkan kepatuhan Dokumen & Video.</p>
                </div>
                <button onClick={() => setShowEksekutifModal(true)} className="w-full sm:w-auto bg-[#174b6f] dark:bg-slate-700 hover:bg-[#103a58] text-white dark:border dark:border-slate-600 px-5 py-3 rounded-xl text-xs font-black tracking-wide flex items-center justify-center shadow-md transition shrink-0 h-[46px]">
                    <FileSignature className="w-4 h-4 mr-2" /> CETAK PDF EKSEKUTIF
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2"><User className="inline w-4 h-4 mb-1" /><br />Total Pegawai Aktif</span>
                        <span className="text-4xl font-black text-[#174b6f] dark:text-white">{PEGAWAI_STATUS.length}</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm text-center">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block mb-2"><FileSpreadsheet className="inline w-4 h-4 mb-1" /><br />Laporan Excel Masuk</span>
                        <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{PEGAWAI_STATUS.filter(p => p.excel).length}</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm text-center">
                        <span className="text-[10px] font-bold text-[#174b6f] dark:text-blue-400 uppercase tracking-widest block mb-2"><Video className="inline w-4 h-4 mb-1" /><br />Bukti Video Valid</span>
                        <span className="text-4xl font-black text-[#174b6f] dark:text-blue-400">{PEGAWAI_STATUS.filter(p => p.ruasData.length > 0).length}</span>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm text-center">
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest block mb-2"><AlertTriangle className="inline w-4 h-4 mb-1" /><br />Mangkir / Belum Lapor</span>
                        <span className="text-4xl font-black text-rose-600 dark:text-rose-400">{PEGAWAI_STATUS.filter(p => !p.excel).length}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
                    <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-black text-xs uppercase tracking-widest dark:text-white flex justify-between items-center">
                        <span className="flex items-center"><Trophy className="w-4 h-4 mr-2 text-yellow-500" /> Status Laporan Pegawai</span>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto max-h-[300px]">
                        {leaderboardData.slice(0, 5).map((di, i) => (
                            <button onClick={() => setSelectedDIModal(di.name)} key={i} className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition shadow-sm text-left group">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm font-black group-hover:bg-yellow-400 group-hover:text-yellow-900 transition">{i + 1}</span>
                                    <div>
                                        <p className="text-sm font-black dark:text-white">{di.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500">{di.tuntas}/{di.pegawai} Pegawai Tuntas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-base font-black text-[#174b6f] dark:text-teal-400 block">{di.score}%</span>
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Skor</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="font-black text-lg dark:text-white flex items-center"><ListFilter className="w-5 h-5 mr-2 text-[#174b6f] dark:text-teal-400" /> TABEL KEPATUHAN</h3>
                    <button onClick={() => setShowRekapModal(true)} className="bg-white dark:bg-slate-900 border dark:border-slate-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center dark:text-white hover:bg-slate-50 transition">
                        <Download className="w-4 h-4 mr-2 text-teal-500" /> Unduh Excel
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input type="month" value={periodeTabel} onChange={e => setPeriodeTabel(e.target.value)} className="w-full border dark:border-slate-600 rounded-xl p-3 text-sm dark:bg-slate-900 dark:text-white outline-none" />
                    <select value={filterJabatan} onChange={e => setFilterJabatan(e.target.value)} className="w-full border dark:border-slate-600 rounded-xl p-3 text-sm dark:bg-slate-900 dark:text-white outline-none">
                        <option value="">Semua Jabatan</option>
                        {JABATAN_LIST.map(j => <option key={j}>{j}</option>)}
                    </select>
                    <select value={filterDI} onChange={e => setFilterDI(e.target.value)} className="w-full border dark:border-slate-600 rounded-xl p-3 text-sm dark:bg-slate-900 dark:text-white outline-none">
                        <option value="">Semua Wilayah DI</option>
                        {DAERAH_IRIGASI_MASTER.map(di => <option key={di.id}>{di.name}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto border dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-sm dark:text-white">
                        <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                            <tr>
                                <th className="p-4">Nama Pegawai & Area</th>
                                <th className="p-4 w-1/3">Video Visual</th>
                                <th className="p-4 text-center w-1/3">E-Kinerja</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPegawai.map(p => {
                                const isTargetedRole = ['PPA', 'POB'].includes(p.jabatan);
                                const isAllRuasLengkap = p.ruasData.length > 0 && p.ruasData.every(r => r.pel === 'lengkap' && r.pem === 'lengkap' && r.ber === 'lengkap');
                                const isTargetMet = p.ruasData.length >= p.totalRuasTarget;
                                const isVideoKompilasiReady = isTargetedRole && isAllRuasLengkap && isTargetMet;
                                const isLengkapSepenuhnya = p.excel && (isTargetedRole ? isVideoKompilasiReady : p.ruasData.length > 0);
                                const waNumber = p.whatsapp.startsWith('0') ? '62' + p.whatsapp.substring(1) : p.whatsapp;

                                return (
                                    <tr key={p.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-base">{p.name}</p>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-bold uppercase mt-1.5">{p.jabatan}</p>
                                            <p className="text-[10px] bg-blue-50 dark:bg-teal-900/30 text-[#174b6f] dark:text-teal-400 px-2 py-1 rounded inline-block mt-3 font-bold uppercase"><MapPin className="inline w-3 h-3 mr-1" />{p.wilayah}</p>

                                            {!isLengkapSepenuhnya && (
                                                <a href={`https://wa.me/${waNumber}?text=${generateWAMessage(p)}`} target="_blank" rel="noopener noreferrer" title="Ingatkan via WA" className="mt-3 w-max bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-teal-400 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-lg text-[9px] font-black uppercase flex items-center shadow-sm hover:scale-105 transition">
                                                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Ingatkan via WA
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-4 align-top">
                                            {p.ruasData.length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-emerald-600 font-bold flex items-center text-xs mb-1"><CheckCircle className="w-4 h-4 mr-1" /> {p.ruasData.length} Ruas Terlapor</span>
                                                    {isTargetedRole && p.ruasData.map((ruas, idx) => {
                                                        const missing = [];
                                                        if (ruas.pel !== 'lengkap') missing.push('Pelumasan');
                                                        if (ruas.pem !== 'lengkap') missing.push('Pemarasan');
                                                        if (ruas.ber !== 'lengkap') missing.push('Pembersihan');
                                                        return missing.length > 0 ? (
                                                            <div key={idx} className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 p-2 rounded-lg border border-rose-100 dark:border-rose-500/20 shadow-sm">
                                                                <strong className="block mb-0.5">{ruas.namaRuas}</strong>Belum kumpul: {missing.join(', ')}
                                                            </div>
                                                        ) : (
                                                            <div key={idx} className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-teal-400 p-2 rounded-lg border border-emerald-100 dark:border-teal-500/20 shadow-sm">
                                                                <strong className="block">{ruas.namaRuas}</strong>Lengkap (100%)
                                                            </div>
                                                        );
                                                    })}
                                                    {isVideoKompilasiReady && (
                                                        <button onClick={() => setSelectedVideoModal(p)} className="mt-4 w-full bg-[#174b6f] hover:bg-[#103a58] text-white px-3 py-2.5 rounded-xl text-[10px] font-bold shadow-md flex items-center justify-center transition uppercase tracking-widest cursor-pointer">
                                                            <Play className="w-3.5 h-3.5 mr-1.5 shrink-0 pointer-events-none" /> Unduh Kompilasi Video
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-bold flex items-center text-xs"><Clock className="w-4 h-4 mr-1" /> Belum ada video</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-top text-center">
                                            {p.excel ? (
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-emerald-600 font-bold flex items-center justify-center text-xs mb-2"><CheckCircle className="w-4 h-4 mr-1" /> Diterima</span>
                                                    <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold shadow-md flex items-center justify-center transition uppercase tracking-widest w-full">
                                                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Unduh Excel
                                                    </button>
                                                    <button className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold shadow-md flex items-center justify-center transition uppercase tracking-widest w-full">
                                                        <FileText className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Unduh PDF
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-rose-500 font-bold flex items-center justify-center text-xs"><AlertTriangle className="w-4 h-4 mr-1" /> Belum Lapor</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDIModal && <DIEmployeesModal diName={selectedDIModal} pegawaiList={PEGAWAI_STATUS} onClose={() => setSelectedDIModal(null)} />}
            {showEksekutifModal && <AdminEksekutifPreview onClose={() => setShowEksekutifModal(false)} />}
            {showRekapModal && <AdminRekapPreview onClose={() => setShowRekapModal(false)} pegawaiList={PEGAWAI_STATUS} />}
            {selectedVideoModal && <VideoKompilasiModal pegawai={selectedVideoModal} onClose={() => setSelectedVideoModal(null)} />}
        </div>
    );
}

function AnomalyDashboard() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-black flex items-center dark:text-white uppercase tracking-widest"><AlertTriangle className="text-rose-500 mr-3" /> Sistem Teguran </h2>
                <p className="text-xs text-slate-500 mt-2 font-medium">Pusat peringatan anomali dan pelanggaran.</p>
            </div>
            <div className="space-y-4">
                {ANOMALIES.map(anom => (
                    <div key={anom.id} className="bg-white dark:bg-slate-800 border dark:border-slate-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${anom.id === 1 ? 'bg-purple-500' : 'bg-rose-500'}`}></div>
                        <div className="pl-3 flex-1">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest mb-3 inline-block border ${anom.id === 1 ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200'}`}>{anom.type}</span>
                            <p className="dark:text-white text-sm font-medium">{anom.msg}</p>
                        </div>
                        <button className="mt-4 md:mt-0 px-6 py-3 rounded-xl text-xs font-black bg-[#174b6f] dark:bg-slate-700 text-white shadow-md uppercase tracking-widest"><Wrench className="w-4 h-4 mr-2 inline" /> {anom.action}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VisualReportMobile({ userData, setUserData }) {
    const [ruasList, setRuasList] = useState([{ id: 1, di: '', namaRuas: '', lat: '', lng: '', lokasiNama: '', isExpanded: true, videos: { 'Pelumasan': { '0%': null, '50%': null, '100%': null }, 'Pemarasan': { '0%': null, '50%': null, '100%': null }, 'Pembersihan Sampah': { '0%': null, '50%': null, '100%': null } }, kegiatanDeskripsi: '', videoUmum: null }]);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const isPekerjaFisik = ['PPA', 'POB'].includes(userData.jabatan);

    const addRuas = () => {
        if (isPekerjaFisik && ruasList.length >= userData.totalRuasTarget) return;
        setRuasList([...ruasList, { id: Date.now(), di: '', namaRuas: '', lat: '', lng: '', lokasiNama: '', isExpanded: true, videos: { 'Pelumasan': { '0%': null, '50%': null, '100%': null }, 'Pemarasan': { '0%': null, '50%': null, '100%': null }, 'Pembersihan Sampah': { '0%': null, '50%': null, '100%': null } }, kegiatanDeskripsi: '', videoUmum: null }]);
    };
    const removeRuas = (id) => { if (ruasList.length > 1) setRuasList(ruasList.filter(r => r.id !== id)); };
    const toggleExpand = (id) => setRuasList(ruasList.map(r => r.id === id ? { ...r, isExpanded: !r.isExpanded } : r));
    const setLocation = (id) => { setRuasList(ruasList.map(r => r.id === id ? { ...r, lat: '-0.9412', lng: '119.8921', lokasiNama: 'Kel. Birobuli Utara, Kec. Palu Selatan' } : r)); };
    const updateVideo = (ruasId, workType, progressType, videoUrl) => { setRuasList(ruasList.map(r => r.id === ruasId ? { ...r, videos: { ...r.videos, [workType]: { ...r.videos[workType], [progressType]: videoUrl } } } : r)); };

    const isRuasComplete = (ruas) => {
        if (isPekerjaFisik) {
            for (const work in ruas.videos) {
                for (const prog in ruas.videos[work]) {
                    if (!ruas.videos[work][prog]) return false;
                }
            }
            return true;
        } else {
            return ruas.videoUmum !== null && ruas.kegiatanDeskripsi.trim() !== '';
        }
    };

    const progressPercentage = isPekerjaFisik ? Math.round((ruasList.length / userData.totalRuasTarget) * 100) : 100;

    return (
        <div className="space-y-6 animate-fadeIn pb-10">

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center justify-between transition-colors">
                <div className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center mr-4 shrink-0">
                        <div className="relative group cursor-pointer overflow-hidden rounded-full w-16 h-16 border border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                            {userData.fotoPegawai ? (
                                <img src={userData.fotoPegawai} className="w-full h-full object-cover" alt="Profil" />
                            ) : (
                                <User className="text-slate-400 w-8 h-8" />
                            )}
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-4 h-4 text-white mb-0.5" />
                                <span className="text-[8px] text-white font-black uppercase tracking-wider">Ganti</span>
                            </div>
                            <input type="file" accept="image/*" title="Klik untuk ubah foto profil" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => { if (e.target.files[0]) setUserData({ ...userData, fotoPegawai: URL.createObjectURL(e.target.files[0]) }) }} />
                        </div>
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1.5 flex items-center"><Camera className="w-2.5 h-2.5 mr-0.5" /> Ubah Foto</p>
                    </div>
                    <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-black text-slate-800 dark:text-white text-base tracking-wide uppercase truncate mb-1.5">{userData.nama}</h3>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] bg-blue-50 dark:bg-teal-900/30 text-[#174b6f] dark:text-teal-400 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-blue-200 dark:border-teal-500/30">
                                    {userData.jabatan} - UPT 1
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    NIP: {userData.nip}
                                </span>
                            </div>
                            <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                <Smartphone className="w-3 h-3 mr-1" /> {userData.whatsapp}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    title="Pengaturan Profil"
                    className="relative z-50 p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition shadow-sm shrink-0 cursor-pointer active:scale-95"
                >
                    <Pen className="w-5 h-5 pointer-events-none" />
                </button>
            </div>

            <div className="bg-[#174b6f] dark:bg-slate-950 p-6 md:p-8 rounded-2xl shadow-md text-white border dark:border-slate-800">
                <h2 className="text-2xl font-black flex items-center mb-2 uppercase"><Video className="w-7 h-7 mr-3 text-yellow-400" /> Audit Visual</h2>
                <p className="text-sm font-medium text-blue-100 dark:text-slate-400">Rekam progres fisik melalui kamera SIGA-OP.</p>

                {isPekerjaFisik && (
                    <div className="mt-8 pt-5 border-t border-blue-800/50 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Target Harian</span>
                            <div className="flex items-center text-sm bg-blue-900/40 rounded-lg p-1 border border-blue-800/50 shadow-inner">
                                <span className="font-black text-white ml-3 mr-2">{ruasList.length}</span>
                                <span className="text-blue-300 dark:text-slate-500 mr-2">/</span>
                                <div className="flex items-center bg-[#103a58] rounded border border-blue-800/50 p-0.5">
                                    <button onClick={() => setUserData({ ...userData, totalRuasTarget: Math.max(1, (userData.totalRuasTarget || 1) - 1) })} className="w-6 h-6 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 rounded transition cursor-pointer" title="Kurangi Target">
                                        <Minus className="w-3 h-3 pointer-events-none" />
                                    </button>
                                    <span className="w-6 text-center font-black text-yellow-400 text-sm">{userData.totalRuasTarget || 1}</span>
                                    <button onClick={() => setUserData({ ...userData, totalRuasTarget: Math.min(20, (userData.totalRuasTarget || 1) + 1) })} className="w-6 h-6 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 rounded transition cursor-pointer" title="Tambah Target">
                                        <Plus className="w-3 h-3 pointer-events-none" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-blue-900/50 rounded-full overflow-hidden border border-blue-900/30 dark:border-slate-800">
                            <div className="h-full bg-yellow-400 dark:bg-teal-500 transition-all duration-500" style={{ width: `${progressPercentage > 100 ? 100 : progressPercentage}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {ruasList.map((ruas, index) => (
                    <div key={ruas.id} className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 flex justify-between items-center cursor-pointer border-b dark:border-slate-700" onClick={() => toggleExpand(ruas.id)}>
                            <div className="flex items-center">
                                <span className="bg-[#174b6f] dark:bg-slate-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black mr-3">{index + 1}</span>
                                <span className="font-black uppercase dark:text-white">{ruas.namaRuas || 'LOKASI BARU'}</span>
                            </div>
                            {ruas.isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                        </div>
                        {ruas.isExpanded && (
                            <div className="p-5 md:p-6 space-y-6">
                                <div className="space-y-4 pb-6 border-b dark:border-slate-700">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">1. Tentukan Titik</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl p-4 text-sm dark:text-white outline-none">
                                        <option value="">Pilih Daerah Irigasi...</option>
                                        {DAERAH_IRIGASI_MASTER.map(di => <option key={di.id}>{di.name}</option>)}
                                    </select>
                                    <input type="text" placeholder="Detail Lokasi" value={ruas.namaRuas} onChange={(e) => setRuasList(ruasList.map(r => r.id === ruas.id ? { ...r, namaRuas: e.target.value } : r))} className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl p-4 text-sm dark:text-white outline-none" />

                                    <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-950 rounded-xl border dark:border-slate-700 mt-4 flex flex-col items-center justify-center">
                                        {!ruas.lat ? (
                                            <button onClick={() => setLocation(ruas.id)} className="bg-yellow-400 dark:bg-slate-800 text-slate-900 dark:text-teal-400 px-6 py-3 rounded-xl text-xs font-black uppercase shadow-md flex items-center cursor-pointer">
                                                <Crosshair className="w-4 h-4 mr-2" /> Dapatkan GPS
                                            </button>
                                        ) : (
                                            <div className="text-center px-4">
                                                <MapPin className="w-8 h-8 text-rose-500 mb-2 mx-auto animate-bounce" />
                                                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm">
                                                    <strong className="text-[#174b6f] dark:text-teal-400 font-mono text-sm block">{ruas.lat}, {ruas.lng}</strong>
                                                    <p className="text-slate-500 text-xs truncate mt-1">{ruas.lokasiNama}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isPekerjaFisik ? (
                                    <div>
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-4">2. Rekam Video Fisik</h4>
                                        <div className="space-y-4">
                                            {['Pelumasan', 'Pemarasan', 'Pembersihan Sampah'].map(work => (
                                                <div key={work} className="border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 font-black uppercase text-sm dark:text-white">{work}</div>
                                                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <VideoSlot progress="0%" label="Belum" videoData={ruas.videos[work]['0%']} onVideoSet={(v) => updateVideo(ruas.id, work, '0%', v)} />
                                                        <VideoSlot progress="50%" label="Proses" videoData={ruas.videos[work]['50%']} onVideoSet={(v) => updateVideo(ruas.id, work, '50%', v)} />
                                                        <VideoSlot progress="100%" label="Selesai" videoData={ruas.videos[work]['100%']} onVideoSet={(v) => updateVideo(ruas.id, work, '100%', v)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Uraian Inspeksi</label>
                                            <textarea rows="5" value={ruas.kegiatanDeskripsi} onChange={(e) => setRuasList(ruasList.map(r => r.id === ruas.id ? { ...r, kegiatanDeskripsi: e.target.value } : r))} placeholder="Tuliskan uraian hasil pengamatan..." className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl p-4 text-sm dark:text-white outline-none" />
                                        </div>
                                        <VideoSlot progress="Video" label="Landscape" videoData={ruas.videoUmum} onVideoSet={(v) => setRuasList(ruasList.map(r => r.id === ruas.id ? { ...r, videoUmum: v } : r))} />
                                    </div>
                                )}

                                {isRuasComplete(ruas) && (
                                    <div className="mt-8 p-6 bg-[#174b6f]/5 dark:bg-[#174b6f]/20 border border-[#174b6f]/20 rounded-2xl flex items-center gap-5 shadow-sm">
                                        <CheckCircle className="w-10 h-10 text-[#174b6f] dark:text-teal-400 shrink-0" />
                                        <div className="flex-1">
                                            <h4 className="font-black text-[#174b6f] dark:text-teal-400 text-base mb-1">Video Siap Dikirim!</h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Sistem akan menyatukan video dan menyematkan teks GPS secara otomatis.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!isPekerjaFisik || ruasList.length < userData.totalRuasTarget ? (
                <button onClick={addRuas} className="w-full py-5 border-2 border-dashed border-[#174b6f]/50 dark:border-teal-500/50 text-[#174b6f] dark:text-teal-400 bg-blue-50 dark:bg-teal-900/10 rounded-2xl text-sm font-black tracking-widest uppercase hover:bg-blue-100 dark:hover:bg-teal-900/30 transition mt-6 shadow-sm cursor-pointer">
                    <Plus className="w-6 h-6 inline mr-2 pointer-events-none" /> TAMBAH LAPORAN
                </button>
            ) : (
                <div className="w-full py-5 bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl text-sm font-black tracking-widest uppercase flex items-center justify-center mt-6 shadow-md">
                    <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> SELURUH TARGET TERPENUHI
                </div>
            )}

            <button className="w-full py-5 font-black uppercase rounded-2xl shadow-lg bg-[#174b6f] dark:bg-teal-600 text-white border-b-4 border-blue-900 active:translate-y-1 mt-8 cursor-pointer">
                <Send className="w-5 h-5 mr-2 inline pointer-events-none" /> KIRIM LAPORAN HARI INI
            </button>

            {showProfileModal && <ProfileFormModal userData={userData} setUserData={setUserData} onClose={() => setShowProfileModal(false)} />}
        </div>
    );
}

function MonthlyReportMobile({ userData, setUserData }) {
    const [periode, setPeriode] = useState('2026-05');
    const [activities, setActivities] = useState([{
        id: 1, tanggal: '2026-05-02', hasilKinerja: 100, dl: 0, tidakMasuk: 0, nilaiAkhir: 100, ket: '',
        slots: [{ waktu: '08.00 - 12.00', detail: '1. Meninjau kondisi sampah di bangunan inlet dan penguras di bendung' }, { waktu: '12.00 - 13.00', detail: '2. Ishoma' }, { waktu: '13.00 - 16.00', detail: '3. Meninjau kondisi pintu air sekunder' }]
    }]);
    const [showPreview, setShowPreview] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const addActivity = () => {
        setActivities([...activities, { id: Date.now(), tanggal: '', hasilKinerja: 100, nilaiAkhir: 100, slots: [{ waktu: '08.00 - 12.00', detail: '' }, { waktu: '12.00 - 13.00', detail: 'Ishoma' }, { waktu: '13.00 - 16.00', detail: '' }] }]);
    };
    const removeActivity = (id) => { if (activities.length > 1) setActivities(activities.filter(a => a.id !== id)); };

    const addSlot = (actId) => setActivities(activities.map(a => a.id === actId ? { ...a, slots: [...a.slots, { waktu: '', detail: '' }] } : a));
    const updateSlot = (actId, slotIdx, field, value) => setActivities(activities.map(a => { if (a.id === actId) { const newSlots = [...a.slots]; newSlots[slotIdx][field] = value; return { ...a, slots: newSlots }; } return a; }));
    const removeSlot = (actId, slotIdx) => setActivities(activities.map(a => { if (a.id === actId) { return { ...a, slots: a.slots.filter((_, i) => i !== slotIdx) }; } return a; }));

    const generateWorkingDays = () => {
        if (!periode) return;
        const [year, month] = periode.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();
        const newActs = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const d = `${year}-${month}-${String(i).padStart(2, '0')}`;
            const day = new Date(d).getDay();
            if (day !== 0 && day !== 6 && !MOCK_HOLIDAYS[d]) {
                newActs.push({
                    id: Date.now() + i, tanggal: d,
                    hasilKinerja: 100, nilaiAkhir: 100, ket: '',
                    slots: [{ waktu: '08.00 - 12.00', detail: '1. Meninjau kondisi saluran' }, { waktu: '12.00 - 13.00', detail: '2. Ishoma' }, { waktu: '13.00 - 16.00', detail: '3. Membersihkan sedimen' }]
                });
            }
        }
        setActivities(newActs);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">

            {/* HEADER IDENTITAS AGAR TOMBOL PEN BISA DIKLIK DI MENU INI JUGA */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center justify-between transition-colors">
                <div className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center mr-4 shrink-0">
                        <div className="relative group cursor-pointer overflow-hidden rounded-full w-16 h-16 border border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                            {userData.fotoPegawai ? (
                                <img src={userData.fotoPegawai} className="w-full h-full object-cover" alt="Profil" />
                            ) : (
                                <User className="text-slate-400 w-8 h-8" />
                            )}
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-4 h-4 text-white mb-0.5" />
                                <span className="text-[8px] text-white font-black uppercase tracking-wider">Ganti</span>
                            </div>
                            <input type="file" accept="image/*" title="Klik untuk ubah foto profil" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => { if (e.target.files[0]) setUserData({ ...userData, fotoPegawai: URL.createObjectURL(e.target.files[0]) }) }} />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-black text-slate-800 dark:text-white text-base tracking-wide uppercase truncate mb-1.5">{userData.nama}</h3>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                <Smartphone className="w-3 h-3 mr-1" /> {userData.whatsapp}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    title="Pengaturan Profil"
                    className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition shadow-sm shrink-0 cursor-pointer"
                >
                    <Pen className="w-5 h-5 pointer-events-none" />
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700">
                <h2 className="text-xl font-black dark:text-white uppercase tracking-widest flex items-center mb-1"><FileSpreadsheet className="mr-2 text-[#174b6f] dark:text-teal-400" /> BUKU HARIAN</h2>
                <p className="text-xs text-slate-500">Otomasi tabel E-Kinerja melewati hari libur.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 space-y-4">
                <h3 className="text-xs font-black uppercase dark:text-white border-b dark:border-slate-700 pb-3 mb-2 flex items-center"><User className="w-4 h-4 mr-2" /> 1. IDENTITAS & TTD</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 mt-2">
                        <label className="text-[10px] font-bold text-[#174b6f] dark:text-teal-400 uppercase block mb-2">Uraian Tugas Jabatan (Kinerja Bulanan)</label>
                        <textarea rows="4" value={userData.uraianBulanan} onChange={e => setUserData({ ...userData, uraianBulanan: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl p-3 text-sm dark:text-white outline-none focus:border-[#174b6f]" placeholder="Tuliskan semua poin uraian tugas yang berlaku satu bulan penuh..."></textarea>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5 mt-4 border-t dark:border-slate-700 pt-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 text-center sm:text-left leading-tight">
                            TTD Pegawai <br /><span className="text-[8px] font-normal text-rose-500">*Format .PNG Transparan</span>
                        </label>
                        <div className="flex gap-3 relative justify-center sm:justify-start">
                            {userData.ttdPegawaiUrl ? <img src={userData.ttdPegawaiUrl} className="w-16 h-16 border rounded-xl object-contain bg-white" alt="TTD" /> : <div className="w-16 h-16 border-dashed border-2 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition"><Pen className="w-5 text-slate-400" /></div>}
                            <input type="file" onChange={(e) => e.target.files[0] && setUserData({ ...userData, ttdPegawaiUrl: URL.createObjectURL(e.target.files[0]) })} className="absolute inset-0 w-16 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 text-center sm:text-left leading-tight">
                            TTD Atasan <br /><span className="text-[8px] font-normal text-rose-500">*Format .PNG Transparan</span>
                        </label>
                        <div className="flex gap-3 relative justify-center sm:justify-start">
                            {userData.ttdAtasanUrl ? <img src={userData.ttdAtasanUrl} className="w-16 h-16 border rounded-xl object-contain bg-white" alt="TTD" /> : <div className="w-16 h-16 border-dashed border-2 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition"><Pen className="w-5 text-slate-400" /></div>}
                            <input type="file" onChange={(e) => e.target.files[0] && setUserData({ ...userData, ttdAtasanUrl: URL.createObjectURL(e.target.files[0]) })} className="absolute inset-0 w-16 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700">
                <div className="bg-[#174b6f] dark:bg-slate-900 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-white uppercase tracking-widest text-sm whitespace-nowrap">2. Tabel Kegiatan</h3>
                        {activities.length > 0 && <span className="text-blue-200 text-[10px] font-bold bg-[#103a58] dark:bg-slate-800 px-2.5 py-1 rounded-lg whitespace-nowrap">Total: {activities.length} Hari Kerja</span>}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto items-center">
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest hidden sm:block whitespace-nowrap">Bulan Kerja:</span>
                        <input type="month" value={periode} onChange={e => setPeriode(e.target.value)} className="rounded-lg p-2 text-sm font-bold flex-1 text-slate-800 outline-none" />
                        <button onClick={generateWorkingDays} className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-yellow-500 transition shadow-sm cursor-pointer whitespace-nowrap">Generate</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {activities.map((act, idx) => (
                        <div key={act.id} className="p-5 border rounded-2xl dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#174b6f] text-white w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black shadow-sm">{idx + 1}</div>
                                    <input type="date" value={act.tanggal} onChange={e => { const n = [...activities]; n[idx].tanggal = e.target.value; setActivities(n) }} className="bg-transparent text-sm font-bold dark:text-white outline-none cursor-pointer" />
                                </div>
                                <button onClick={() => removeActivity(act.id)} className="text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition cursor-pointer"><Trash2 className="w-4 h-4 pointer-events-none" /></button>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kinerja Pelaksana Tugas (Uraian & Waktu)</label>
                                {act.slots.map((slot, sIdx) => (
                                    <div key={sIdx} className="flex gap-2 items-start">
                                        <input type="text" placeholder="08.00 - 12.00" value={slot.waktu} onChange={e => updateSlot(act.id, sIdx, 'waktu', e.target.value)} className="w-[100px] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono dark:bg-slate-800 dark:text-white outline-none focus:border-[#174b6f] transition" />
                                        <textarea placeholder="Detail kegiatan..." value={slot.detail} onChange={e => updateSlot(act.id, sIdx, 'detail', e.target.value)} className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs dark:bg-slate-800 dark:text-white outline-none focus:border-[#174b6f] transition" rows="1" />
                                        <button onClick={() => removeSlot(act.id, sIdx)} className="p-2.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"><X className="w-4 h-4 pointer-events-none" /></button>
                                    </div>
                                ))}
                                <button onClick={() => addSlot(act.id)} className="text-[10px] bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-[#174b6f] dark:text-teal-400 px-3 py-1.5 rounded-lg font-bold flex items-center mt-2 transition border border-blue-200 dark:border-slate-600 cursor-pointer"><Plus className="w-3 h-3 mr-1 pointer-events-none" /> Tambah Jam Kegiatan</button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addActivity} className="w-full mt-6 py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl font-black text-xs text-slate-400 uppercase hover:text-[#174b6f] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"><Plus className="inline w-4 h-4 mr-1 pointer-events-none" /> Tambah Baris Manual</button>
            </div>

            <button onClick={() => setShowPreview(true)} className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center transition cursor-pointer"><Eye className="w-5 h-5 mr-2 pointer-events-none" /> Lihat Dokumen Cetak</button>

            {showPreview && <ExcelPreviewModal userData={userData} periode={periode} activities={activities} onClose={() => setShowPreview(false)} />}
            {showProfileModal && <ProfileFormModal userData={userData} setUserData={setUserData} onClose={() => setShowProfileModal(false)} />}
        </div>
    );
}

// ==========================================
// 4. MAIN LAYOUT
// ==========================================
function BeloApp({ role, onLogout, isDarkMode, toggleDarkMode }) {
    const [activeMenu, setActiveMenu] = useState(role === 'admin' ? 'evaluasi' : 'report_visual');
    const [isOffline, setIsOffline] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setIsOffline(Math.random() > 0.8), 15000);
        return () => clearInterval(interval);
    }, []);

    const [userData, setUserData] = useState({
        nama: 'Arif Yunan Pramadita, A.Md.T.', nip: '20011023 202504 1 003', whatsapp: '081234567890', jabatan: 'Juru Operasi dan Pemeliharaan', wilayah: 'D.I. Kolondom',
        atasanNama: 'Ir. Christian. P., ST., M.Eng.', atasanNip: '19790929 201408 1 002', atasanJabatan: 'Kepala Seksi Operasi dan Pemeliharaan UPT PSDA Wil. 1',
        uraianBulanan: '1. Membantu pengamat untuk tugas-tugas yang berkaitan dengan operasi dan pemeliharaan jaringan irigasi.\n2. Membuat laporan operasi dan pemeliharaan jaringan irigasi.\n3. Mendampingi PPA melakukan kegiatan pemeliharaan pintu air.\n4. Mengawasi pekerjaan pemeliharaan rutin.',
        fotoPegawai: null, ttdPegawaiUrl: null, ttdAtasanUrl: null, totalRuasTarget: 2
    });

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">

            {role === 'admin' && (
                <div className="w-64 bg-white dark:bg-slate-950 border-r dark:border-slate-800 flex-col hidden md:flex transition-colors z-40">
                    <div className="p-6 border-b dark:border-slate-800 flex flex-col items-center text-center">
                        <div className="bg-[#174b6f] p-2.5 rounded-xl mb-3 shadow-md"><Droplet className="w-6 h-6 text-yellow-400" /></div>
                        <h1 className="text-2xl font-black text-[#174b6f] dark:text-white tracking-widest uppercase">SIGA OP</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Admin Pusat</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        <MenuBtn icon={<BarChart3 />} label="Evaluasi Kinerja" active={activeMenu === 'evaluasi'} onClick={() => setActiveMenu('evaluasi')} />
                        <MenuBtn icon={<MapIcon />} label="Peta Geospasial" active={activeMenu === 'v_maps'} onClick={() => setActiveMenu('v_maps')} />
                        <MenuBtn icon={<AlertTriangle />} label="Sistem Teguran " active={activeMenu === 'anomaly'} onClick={() => setActiveMenu('anomaly')} badge={2} />
                    </nav>
                </div>
            )}

            {role === 'admin' && showMobileNav && (
                <div className="fixed inset-0 z-[100] flex justify-end md:hidden">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMobileNav(false)}></div>
                    <div className="w-64 bg-white dark:bg-slate-950 border-l dark:border-slate-800 flex flex-col shadow-2xl z-10 animate-slideLeft">
                        <div className="p-5 flex justify-between items-center border-b dark:border-slate-800">
                            <h1 className="text-lg font-black text-[#174b6f] dark:text-white uppercase"><Droplet className="w-4 h-4 text-yellow-400 inline mr-2" /> MENU</h1>
                            <button onClick={() => setShowMobileNav(false)} className="text-slate-400 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            <MenuBtn icon={<BarChart3 />} label="Evaluasi Kinerja" active={activeMenu === 'evaluasi'} onClick={() => { setActiveMenu('evaluasi'); setShowMobileNav(false); }} />
                            <MenuBtn icon={<MapIcon />} label="Peta Geospasial" active={activeMenu === 'v_maps'} onClick={() => { setActiveMenu('v_maps'); setShowMobileNav(false); }} />
                            <MenuBtn icon={<AlertTriangle />} label="Sistem Teguran " active={activeMenu === 'anomaly'} onClick={() => { setActiveMenu('anomaly'); setShowMobileNav(false); }} badge={2} />
                        </nav>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col h-full relative overflow-y-auto bg-slate-50 dark:bg-slate-900">

                <header className="h-20 bg-[#174b6f] dark:bg-slate-950 border-b border-[#103a58] dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 py-3 sticky top-0 z-40 shadow-md">
                    <div className="flex items-center text-white">
                        <Shield className="w-6 h-6 mr-3 text-yellow-400 hidden sm:block" />
                        <span className="font-black tracking-wider uppercase text-lg">{role === 'admin' ? 'Dashboard Admin' : 'Ruang Kerja Petugas'}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={toggleDarkMode} className="p-2.5 rounded-xl text-blue-100 hover:bg-white/10 transition">
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        {role === 'petugas' && (
                            <>
                                <button onClick={() => setActiveMenu('darurat')} className="bg-rose-500 text-white hover:bg-rose-600 px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center shadow-md hidden sm:flex uppercase tracking-wider transition hover:scale-105">
                                    <AlertTriangle className="w-4 h-4 mr-2" /> Lapor SOS
                                </button>
                                <button onClick={() => setActiveMenu('darurat')} className="bg-rose-500 text-white p-2.5 rounded-xl shadow-md sm:hidden">
                                    <AlertTriangle className="w-5 h-5" />
                                </button>
                                {isOffline ? (
                                    <span className="flex items-center text-[11px] text-amber-200 font-bold bg-amber-500/20 px-3 py-2.5 rounded-xl hidden sm:flex uppercase tracking-widest border border-amber-500/30">
                                        <CloudOff className="w-4 h-4 mr-2" /> Offline
                                    </span>
                                ) : (
                                    <span className="flex items-center text-[11px] text-teal-200 font-bold bg-emerald-500/20 px-3 py-2.5 rounded-xl hidden sm:flex uppercase tracking-widest border border-emerald-500/30">
                                        <span className="relative flex h-2.5 w-2.5 mr-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                                        </span>
                                        Online
                                    </span>
                                )}
                            </>
                        )}
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center px-4 py-2.5 text-[11px] font-bold rounded-xl text-blue-100 hover:bg-white/10 uppercase tracking-widest transition">
                            <LogOut className="w-4 h-4 md:mr-2" /> <span className="hidden sm:inline">Keluar</span>
                        </button>
                        {role === 'admin' && (
                            <button onClick={() => setShowMobileNav(true)} className="md:hidden p-2.5 bg-white/10 text-white rounded-xl"><Menu className="w-5 h-5" /></button>
                        )}
                    </div>
                </header>

                <main className={`flex-1 ${role === 'petugas' ? 'pb-24 px-3 pt-6 sm:px-6' : 'p-4 lg:p-8'}`}>
                    {role === 'admin' && activeMenu === 'v_maps' && <AdminVMapsDashboard isDarkMode={isDarkMode} />}
                    {role === 'admin' && activeMenu === 'evaluasi' && <AdminEvaluasiDashboard />}
                    {role === 'admin' && activeMenu === 'anomaly' && <AnomalyDashboard />}

                    {role === 'petugas' && (
                        <div className="max-w-3xl mx-auto">
                            {activeMenu === 'report_visual' && <VisualReportMobile userData={userData} setUserData={setUserData} />}
                            {activeMenu === 'report_excel' && <MonthlyReportMobile userData={userData} setUserData={setUserData} />}
                            {activeMenu === 'history' && <RiwayatLaporanPetugas />}
                            {activeMenu === 'darurat' && <FormDaruratPetugas onBack={() => setActiveMenu('report_visual')} />}
                        </div>
                    )}
                </main>

                {role === 'petugas' && (
                    <div className="fixed bottom-0 w-full sm:max-w-3xl sm:left-1/2 sm:-translate-x-1/2 bg-white dark:bg-slate-950 border-t dark:border-slate-800 flex justify-around p-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
                        <button onClick={() => setActiveMenu('report_visual')} className={`flex flex-col items-center p-2.5 rounded-xl w-1/3 transition-colors ${activeMenu === 'report_visual' ? 'text-[#174b6f] dark:text-teal-400 font-bold bg-blue-50/50 dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Video className="w-6 h-6 mb-1" />
                            <span className="text-[10px] tracking-wide">Video Visual</span>
                        </button>
                        <button onClick={() => setActiveMenu('report_excel')} className={`flex flex-col items-center p-2.5 rounded-xl w-1/3 transition-colors ${activeMenu === 'report_excel' ? 'text-[#174b6f] dark:text-teal-400 font-bold bg-blue-50/50 dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                            <FileSpreadsheet className="w-6 h-6 mb-1" />
                            <span className="text-[10px] tracking-wide">Buku Harian</span>
                        </button>
                        <button onClick={() => setActiveMenu('history')} className={`flex flex-col items-center p-2.5 rounded-xl w-1/3 transition-colors ${activeMenu === 'history' ? 'text-[#174b6f] dark:text-teal-400 font-bold bg-blue-50/50 dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                            <History className="w-6 h-6 mb-1" />
                            <span className="text-[10px] tracking-wide">Riwayat</span>
                        </button>
                    </div>
                )}
            </div>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border dark:border-slate-700 text-center">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5">
                            <LogOut className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black dark:text-white mb-2 uppercase tracking-wide">Konfirmasi Keluar</h3>
                        <p className="text-sm text-slate-500 mb-8">Anda yakin ingin mengakhiri sesi dan keluar dari sistem SIGA OP SDA?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 dark:text-white py-3.5 rounded-xl font-bold transition">Batal</button>
                            <button onClick={onLogout} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold shadow-md transition">Keluar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// 5. ROOT COMPONENT
// ==========================================
export default function App() {
    const [authState, setAuthState] = useState('landing');
    const [isDarkMode, setIsDarkMode] = useState(false);

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            {authState === 'landing' ? (
                <LandingPage onLogin={(role) => setAuthState(role)} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
            ) : (
                <BeloApp role={authState} onLogout={() => setAuthState('landing')} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
            )}
        </div>
    );
}
