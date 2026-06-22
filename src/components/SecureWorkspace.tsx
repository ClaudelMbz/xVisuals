import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Folder, 
  FolderPlus, 
  FolderOpen, 
  File, 
  FileImage, 
  FileText, 
  FileCode,
  FileArchive, 
  Trash2, 
  Download, 
  UploadCloud, 
  Eye, 
  ArrowLeft, 
  Home, 
  Database, 
  Save, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  HardDrive, 
  ChevronRight,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Bytes,
  type DocumentData
} from 'firebase/firestore';

interface SecureWorkspaceProps {
  userId: string;
  userEmail: string;
  onLoadSavedReconciliation: (rawInput: string) => void;
}

interface Folder {
  id: string;
  name: string;
  createdAt: any;
}

interface SecureFile {
  id: string;
  folderId: string; // "" represents ROOT
  name: string;      // User-assigned custom display name
  fileName: string;  // Original file name
  fileType: string;
  fileSize: number;
  fileData?: any;    // Converted Base64 or Firestore Bytes
  createdAt: any;
}

interface SavedReconciliation {
  id: string;
  name: string;
  rawInput: string;
  createdAt: any;
  resultCount: number;
}

export default function SecureWorkspace({ userId, userEmail, onLoadSavedReconciliation }: SecureWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'reconciliations'>('files');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Data State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allFiles, setAllFiles] = useState<SecureFile[]>([]);
  const [reconciliations, setReconciliations] = useState<SavedReconciliation[]>([]);
  
  // Lock System States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'download' | 'preview'; file: SecureFile } | null>(null);

  // Navigation & Search State
  const [activeFolderId, setActiveFolderId] = useState<string>(''); // "" is Root
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form States
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Preview State
  const [previewFile, setPreviewFile] = useState<SecureFile | null>(null);
  const [isRetrieving, setIsRetrieving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load everything on mount/userId change
  useEffect(() => {
    fetchFoldersAndFiles();
    fetchReconciliations();
  }, [userId]);

  // Synchronize target upload folder with currently open folder
  useEffect(() => {
    setSelectedFolderId(activeFolderId);
  }, [activeFolderId]);

  const fetchFoldersAndFiles = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // 1. Fetch Folders
      const foldersQuery = query(
        collection(db, 'folders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const foldersSnapshot = await getDocs(foldersQuery);
      const fetchedFolders: Folder[] = [];
      foldersSnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedFolders.push({
          id: doc.id,
          name: data.name || 'Dossier sans nom',
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      setFolders(fetchedFolders);

      // 2. Fetch Files
      const filesQuery = query(
        collection(db, 'secure_files'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const filesSnapshot = await getDocs(filesQuery);
      const fetchedFiles: SecureFile[] = [];
      filesSnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedFiles.push({
          id: doc.id,
          folderId: data.folderId || '',
          name: data.name || 'Fichier sans titre',
          fileName: data.fileName || 'unknown.dat',
          fileType: data.fileType || 'application/octet-stream',
          fileSize: data.fileSize || 0,
          fileData: data.fileData || '',
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      setAllFiles(fetchedFiles);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setErrorMessage("Impossible d'accéder à vos documents confidentiels. Vérifiez la connexion Firestore.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReconciliations = async () => {
    try {
      const q = query(
        collection(db, 'saved_reconciliations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedReconcs: SavedReconciliation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedReconcs.push({
          id: doc.id,
          name: data.name || 'Rapprochement sans nom',
          rawInput: data.rawInput || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          resultCount: data.resultCount || 0
        });
      });
      setReconciliations(fetchedReconcs);
    } catch (err: any) {
      console.error('Error fetching reconciliations:', err);
    }
  };

  // Create Folder handler
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    setErrorMessage('');
    try {
      await addDoc(collection(db, 'folders'), {
        userId,
        name: newFolderName.trim(),
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
      await fetchFoldersAndFiles();
    } catch (err) {
      console.error('Error creating folder:', err);
      setErrorMessage("Échec lors de la création du dossier.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // File selection preprocessing
  const processFileSelection = (file: File) => {
    // Up to 1 MB limit for native Firestore documents (no base64 overhead)
    const limit = 1000 * 1024;
    if (file.size > limit) {
      setErrorMessage(`Le fichier "${file.name}" dépasse le quota maximal autorisé de 1 Mo pour le stockage direct sécurisé.`);
      return;
    }
    setErrorMessage('');
    setUploadFile(file);
    // Suggest visual default name without raw extension
    const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setUploadName(cleanName);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileSelection(e.target.files[0]);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileSelection(e.dataTransfer.files[0]);
    }
  };

  // File Upload flow (Reads file as ArrayBuffer and saves directly as Bytes in Firestore - Split architecture for performance)
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      const arrayBuffer = await uploadFile.arrayBuffer();
      const bytes = Bytes.fromUint8Array(new Uint8Array(arrayBuffer));

      // 1. Save metadata ONLY to secure_files (enabling lightning-fast listings)
      const docRef = await addDoc(collection(db, 'secure_files'), {
        userId,
        folderId: selectedFolderId || '', // Empty stands for root
        name: uploadName.trim() || uploadFile.name,
        fileName: uploadFile.name,
        fileType: uploadFile.type || 'application/octet-stream',
        fileSize: uploadFile.size,
        // fileData is omitted here to preserve high list fetching speeds!
        createdAt: serverTimestamp()
      });

      // 2. Save heavy payload into separate collection pointing to same ID
      await setDoc(doc(db, 'secure_file_payloads', docRef.id), {
        fileData: bytes
      });

      // Clean form status
      setUploadFile(null);
      setUploadName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchFoldersAndFiles();
    } catch (err: any) {
      console.error('File Upload error:', err);
      setErrorMessage("Erreur d'écriture binaire brute sur Firestore (La base de données est lente).");
    } finally {
      setIsUploading(false);
    }
  };

  // Resolve fileData URL dynamically (handles legacy base64 strings and new Bytes objects)
  const getFileUrl = (file: SecureFile): string => {
    if (!file.fileData) return '';
    if (typeof file.fileData === 'string') {
      return file.fileData; // Legacy dataURI
    }
    try {
      const uint8 = file.fileData.toUint8Array();
      const blob = new Blob([uint8], { type: file.fileType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Error unpacking firestore Bytes:', e);
      return '';
    }
  };

  // Download Trigger Utility
  const handleDownloadFile = (file: SecureFile) => {
    try {
      const url = getFileUrl(file);
      if (!url) {
        setErrorMessage("Impossible de dériver l'adresse de téléchargement.");
        return;
      }
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke the ObjectURL if generated dynamically from native Bytes
      if (typeof file.fileData !== 'string') {
        setTimeout(() => URL.revokeObjectURL(url), 150);
      }
    } catch (err) {
      console.error('Download error:', err);
      setErrorMessage("Échec lors du téléchargement local de l'entité.");
    }
  };

  // Lazy load file payload from secure_file_payloads (or fallback to secure_files for legacy documents)
  const loadFilePayload = async (file: SecureFile): Promise<any> => {
    if (file.fileData) {
      return file.fileData; // Already loaded!
    }

    // 1. Try to fetch from separate payloads collection
    try {
      const payloadRef = doc(db, 'secure_file_payloads', file.id);
      const payloadDoc = await getDoc(payloadRef);
      if (payloadDoc.exists()) {
        const payloadData = payloadDoc.data();
        if (payloadData.fileData) {
          return payloadData.fileData;
        }
      }
    } catch (e) {
      console.error('Error fetching separate payload:', e);
    }

    // 2. Fallback to main document (for backward compatibility with legacy uploaded files)
    try {
      const fileRef = doc(db, 'secure_files', file.id);
      const fileDoc = await getDoc(fileRef);
      if (fileDoc.exists()) {
        const fileDocData = fileDoc.data();
        if (fileDocData.fileData) {
          return fileDocData.fileData;
        }
      }
    } catch (e) {
      console.error('Error fetching fallback legacy payload:', e);
    }

    throw new Error("Contenu binaire ou chiffré introuvable sur le serveur.");
  };

  // Execute the download or preview command with visual spinner loading state
  const executeFileAction = async (actionType: 'download' | 'preview', file: SecureFile) => {
    setIsRetrieving(true);
    setErrorMessage('');
    try {
      const fileData = await loadFilePayload(file);
      const fullyLoadedFile: SecureFile = {
        ...file,
        fileData
      };

      if (actionType === 'download') {
        handleDownloadFile(fullyLoadedFile);
      } else {
        setPreviewFile(fullyLoadedFile);
      }
    } catch (err: any) {
      console.error('Action execution error:', err);
      setErrorMessage("Échec du décapsulage binaire du fichier sécurisé (La base de données est lente).");
    } finally {
      setIsRetrieving(false);
    }
  };

  // Password authorization execution gateway
  const runWithPassword = (actionType: 'download' | 'preview', file: SecureFile) => {
    if (isUnlocked) {
      executeFileAction(actionType, file);
    } else {
      setPendingAction({ type: actionType, file });
      setShowUnlockModal(true);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  // Deletion workflows (cleans up both metadata and separate payload)
  const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!window.confirm('Voulez-vous vraiment détruire définitivement ce document chiffré ?')) return;

    setErrorMessage('');
    try {
      // Delete metadata
      await deleteDoc(doc(db, 'secure_files', fileId));
      
      // Attempt to delete payload silently as well to avoid duplicates/orphans
      try {
        await deleteDoc(doc(db, 'secure_file_payloads', fileId));
      } catch (payloadErr) {
        console.warn('Silent payload cleanup warning:', payloadErr);
      }

      setAllFiles(prev => prev.filter(f => f.id !== fileId));
      if (previewFile?.id === fileId) setPreviewFile(null);
    } catch (err) {
      console.error('Error deleting file:', err);
      setErrorMessage("Impossible de supprimer le document.");
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation();
    const folderFiles = allFiles.filter(f => f.folderId === folder.id);
    let confirmMsg = `Voulez-vous supprimer le dossier "${folder.name}" ?`;
    if (folderFiles.length > 0) {
      confirmMsg += ` Ce dossier contient ${folderFiles.length} fichier(s) qui seront également détruit(s) définitivement de votre sandbox.`;
    }

    if (!window.confirm(confirmMsg)) return;

    setErrorMessage('');
    try {
      // 1. Delete associated files
      for (const f of folderFiles) {
        await deleteDoc(doc(db, 'secure_files', f.id));
      }
      // 2. Delete Folder doc
      await deleteDoc(doc(db, 'folders', folder.id));
      
      if (activeFolderId === folder.id) {
        setActiveFolderId(''); // return to root
      }
      await fetchFoldersAndFiles();
    } catch (err) {
      console.error('Error deleting folder:', err);
      setErrorMessage("Impossible de purger le dossier.");
    }
  };

  const handleDeleteReconc = async (reconcId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet enregistrement ?')) return;

    setErrorMessage('');
    try {
      await deleteDoc(doc(db, 'saved_reconciliations', reconcId));
      await fetchReconciliations();
    } catch (err) {
      console.error('Error deleting reconciliation:', err);
      setErrorMessage("Impossible de supprimer le rapprochement.");
    }
  };

  // Size formatting helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Octet';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Date format helper
  const formatDate = (date: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Base64 Text Decoding UI Helper (handles legacy base64 or native Bytes objects)
  const decodeBase64Text = (file: SecureFile) => {
    if (!file.fileData) return '';
    if (typeof file.fileData === 'string') {
      try {
        const base64Content = file.fileData.split(',')[1];
        return decodeURIComponent(escape(atob(base64Content)));
      } catch (e) {
        return "Fichier binaire (Impossible d'afficher en aperçu brut). Veuillez le télécharger pour le consulter.";
      }
    }
    try {
      const uint8 = file.fileData.toUint8Array();
      const decoder = new TextDecoder();
      return decoder.decode(uint8);
    } catch (e) {
      return "Fichier binaire (Impossible d'afficher en aperçu brut). Veuillez le télécharger pour le consulter.";
    }
  };

  const getFileIcon = (mimeType: string) => {
    const type = mimeType.toLowerCase();
    if (type.includes('image/')) return <FileImage size={18} className="text-emerald-500" />;
    if (type.includes('pdf')) return <FileText size={18} className="text-rose-500" />;
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <Database size={18} className="text-green-600" />;
    if (type.includes('json') || type.includes('code') || type.includes('text/css') || type.includes('javascript') || type.includes('typescript')) {
      return <FileCode size={18} className="text-blue-500" />;
    }
    if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('zip-compressed')) {
      return <FileArchive size={18} className="text-amber-500" />;
    }
    return <File size={18} className="text-slate-400" />;
  };

  // Helper values for current folder details
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const activeFolderName = activeFolder ? activeFolder.name : 'Racine des Fichiers';

  // Files Filter logic based on Folder navigation and Search query
  const filteredFiles = allFiles.filter(file => {
    const matchesFolder = file.folderId === activeFolderId;
    const matchesSearch = searchQuery 
      ? file.name.toLowerCase().includes(searchQuery.toLowerCase()) || file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    // If searching globally, ignore folder boundaries so user can find files anywhere!
    return searchQuery ? matchesSearch : (matchesFolder && matchesSearch);
  });

  // Calculate storage stats metrics
  const totalWeight = allFiles.reduce((acc, current) => acc + current.fileSize, 0);
  const storageLimit = 8 * 1024 * 1024; // 8 Megabytes sandbox limit
  const storagePercentage = Math.min((totalWeight / storageLimit) * 100, 100);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8 text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 text-amber-800 p-1.5 rounded-lg border border-amber-200">
              <Lock size={15} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Espace Sécurisé d'Ingénierie</h3>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
            Coffre-fort privé de <span className="text-blue-600 font-semibold">{userEmail}</span> — Chiffré dans Firestore
          </p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[9px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Firestore Sandbox Connectée
        </div>
      </div>

      {/* Main warning feedback, if any */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div className="flex-1 font-sans">{errorMessage}</div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Internal Nav Tabs */}
      <div className="flex gap-2.5 mb-8 border-b border-slate-100 pb-4">
        <button
          onClick={() => setActiveSubTab('files')}
          className={`px-4.5 py-2.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5
            ${activeSubTab === 'files' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-100'
            }
          `}
        >
          <Folder size={13} /> Coffre-fort de Fichiers & Dossiers
        </button>
        <button
          onClick={() => setActiveSubTab('reconciliations')}
          className={`px-4.5 py-2.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5
            ${activeSubTab === 'reconciliations' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-100'
            }
          `}
        >
          <Database size={13} /> Rapports & Alignements EAN
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 opacity-60">
          <RefreshCw size={24} className="animate-spin text-blue-600 mb-2" />
          <span className="font-mono text-xs">Extraction des structures depuis Firestore...</span>
        </div>
      ) : activeSubTab === 'files' ? (
        
        /* WORKSPACE SUBTAB: SECURE FILES & FOLDERS */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Side panel with Folder navigation & statistics metrics */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Create Folder Component form */}
            <div className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-900 mb-2.5 flex items-center gap-1.5">
                <FolderPlus size={15} className="text-blue-600" /> Archiver un Nouveau Dossier
              </h4>
              <form onSubmit={handleCreateFolder} className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="ex : Catalogues, Relevés, Codes..."
                  required
                  maxLength={30}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 font-sans text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white"
                />
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer"
                >
                  {isCreatingFolder ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </form>
            </div>

            {/* Folder Lists sidebar navigation */}
            <div className="border border-slate-100 bg-white p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider">Vos Dossiers</h4>
                <p className="text-[10px] text-slate-400 font-mono font-bold leading-none">{folders.length + 1} SÉCTIONS</p>
              </div>

              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                {/* Root item virtual folder */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFolderId('');
                    setSearchQuery('');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer group
                    ${activeFolderId === '' 
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 pl-3' 
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Home size={14} className={activeFolderId === '' ? 'text-blue-600' : 'text-slate-400'} />
                    <span>Répertoire Racine (/)</span>
                  </div>
                  <span className="font-mono text-[9px] bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                    {allFiles.filter(f => f.folderId === '').length}
                  </span>
                </button>

                {/* Subfolders list */}
                {folders.map((folder) => {
                  const folderFilesCount = allFiles.filter(f => f.folderId === folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      className={`group/item flex items-center justify-between rounded-xl transition-all p-1
                        ${activeFolderId === folder.id 
                          ? 'bg-blue-50 border-l-2 border-blue-600' 
                          : 'hover:bg-slate-50'
                        }
                      `}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFolderId(folder.id);
                          setSearchQuery('');
                        }}
                        className={`flex-1 text-left p-2 text-xs transition-all truncate cursor-pointer flex items-center gap-2
                          ${activeFolderId === folder.id ? 'text-blue-700 font-bold' : 'text-slate-600'}
                        `}
                      >
                        <Folder size={14} className={activeFolderId === folder.id ? 'text-blue-500 fill-blue-100' : 'text-slate-400 group-hover/item:text-slate-600'} />
                        <span className="truncate">{folder.name}</span>
                      </button>

                      <div className="flex items-center gap-2 pr-2">
                        <span className="font-mono text-[9px] text-slate-400 font-semibold">
                          {folderFilesCount}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(e, folder)}
                          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer"
                          title="Supprimer ce dossier"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quota dashboard indicators */}
            <div className="border border-slate-100 bg-slate-50/20 p-5 rounded-2xl font-sans text-xs space-y-3.5">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[10px]">
                <HardDrive size={13} className="text-slate-400" /> Capacité Sandbox Chiffrée
              </h5>
              
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>Charge Utilisée : {formatBytes(totalWeight)}</span>
                  <span>Limité à 8 Mo</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full
                      ${storagePercentage > 85 ? 'bg-rose-500' : storagePercentage > 60 ? 'bg-amber-500' : 'bg-blue-600'}
                    `} 
                    style={{ width: `${storagePercentage}%` }} 
                  />
                </div>
              </div>

              <p className="text-[10px] leading-relaxed text-slate-400 italic">
                Nous encapsulons directement vos flux en binaire natif ultra-rapide sur vos privilèges Firestore isolés. Idéal pour conserver vos comptes rendus d'inventaires, schémas de données ou tableurs pivots confidentiels.
              </p>
            </div>

          </div>

          {/* Secure interactive file manager details */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Folder breadcrumbs & Global Search query box */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 font-semibold uppercase">Parcours :</span>
                <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-lg flex items-center gap-1">
                  <Home size={12} /> Racine
                </span>
                {activeFolderId && (
                  <>
                    <ChevronRight size={11} className="text-slate-300" />
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <FolderOpen size={11} /> {activeFolderName}
                    </span>
                  </>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher partout..."
                  className="w-full pl-8 pr-3.5 py-2 placeholder-slate-400 text-slate-800 bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none text-xs transition-all"
                />
                <Search size={13} className="text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Dynamic Drag/drop upload panel */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider">Enregistrer un Document</h4>
              
              {!uploadFile ? (
                /* Drag Zone empty state */
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5
                    ${dragActive 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/40'
                    }
                  `}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-blue-600">Glissez-déposez un fichier</span>{" "}
                    <span className="text-xs text-slate-500">ou cliquez pour parcourir</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Formats: PDF, Excel, ZIP, Code, Images (Max: 1 Mo)</p>
                </div>
              ) : (
                /* Interactive naming & destination assignment form */
                <form onSubmit={handleFileUpload} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        {getFileIcon(uploadFile.type)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 block truncate max-w-xs">{uploadFile.name}</span>
                        <span className="font-mono text-[9px] text-slate-500 block">{formatBytes(uploadFile.size)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadName('');
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                      title="Annuler"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Custom Name text field */}
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block">Nom personnalisé du document</label>
                      <input
                        type="text"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="Donnez un nom d'index..."
                        required
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Folder selector lookup dropdown */}
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase font-bold text-slate-500 block">Dossier de destination</label>
                      <select
                        value={selectedFolderId}
                        onChange={(e) => setSelectedFolderId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner : Racine (/)</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>📁/ {f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                   <button
                    type="submit"
                    disabled={isUploading || !uploadName.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" /> Chiffrement et téléversement binaire Firestore...
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} /> Chiffrer dans Coffre-fort
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* List and Grid representation of files details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-1">
                <h4 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider">
                  Documents enregistrés ({filteredFiles.length})
                </h4>
                {isUnlocked ? (
                  <button
                    onClick={() => setIsUnlocked(false)}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-emerald-100 rounded-lg text-[9px] font-mono uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Verrouiller à nouveau"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Déverrouillé (Verrouiller)
                  </button>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[9px] font-mono uppercase font-bold flex items-center gap-1.5 select-none shadow-sm">
                    🔒 Documents Sécurisés
                  </span>
                )}
              </div>
              {searchQuery && <p className="text-[10px] text-blue-600 font-bold lowercase font-mono">Filtre actif : "{searchQuery}"</p>}

              {filteredFiles.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 bg-slate-50/20 text-slate-400 italic font-sans text-xs flex flex-col items-center justify-center gap-2">
                  <Folder size={24} strokeWidth={1} className="text-slate-300" />
                  <span>Aucun enregistrement pour le moment</span>
                  <p className="text-[10px] text-slate-400 not-italic font-mono">Glissez-déposez vos pièces pour démarrer le stockage.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      onClick={() => runWithPassword('preview', file)}
                      className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4.5 hover:shadow-md transition-all flex items-start gap-3 relative group cursor-pointer"
                    >
                      {/* Left icon wrapper */}
                      <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all shrink-0">
                        {getFileIcon(file.fileType)}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0 pr-6 space-y-1">
                        <h5 className="font-bold text-xs text-slate-800 truncate leading-snug group-hover:text-blue-700 transition-colors">
                          {file.name}
                        </h5>
                        <p className="font-mono text-[9px] text-slate-400 truncate">
                          Original: <span className="text-slate-500 font-bold">{file.fileName}</span>
                        </p>
                        
                        <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400 pt-1">
                          <span>{formatBytes(file.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(file.createdAt)}</span>
                        </div>

                        {/* Location Badge (only visible if searching globally) */}
                        {searchQuery && (
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold">
                              📍 {file.folderId ? folders.find(fd => fd.id === file.folderId)?.name : 'Racine'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick floating action buttons with absolute placements */}
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            runWithPassword('preview', file);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded"
                          title="Aperçu rapide"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            runWithPassword('download', file);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded"
                          title="Télécharger"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFile(e, file.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        
        /* WORKSPACE SUBTAB: SAVED RECONCILIATIONS */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Rapprochements EAN sauvegardés</h4>
              <p className="text-xs text-slate-400">Restaurer ou purger des pipelines conservés précédemment</p>
            </div>
            <button 
              onClick={fetchReconciliations}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center gap-1"
              title="Actualiser la liste"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {reconciliations.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 text-slate-400 italic font-sans text-xs flex flex-col items-center justify-center gap-2.5">
              <Database size={24} strokeWidth={1.2} />
              <span>Aucune sauvegarde consolidée disponible.</span>
              <p className="max-w-xs text-[11px] opacity-70">
                Vous pouvez exécuter et sauvegarder un tri EAN dans l'onglet <strong>Projets & Diagnostics</strong> de la plateforme.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reconciliations.map((rec) => (
                <div key={rec.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col justify-between relative group">
                  <button 
                    onClick={() => handleDeleteReconc(rec.id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Supprimer"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="font-mono text-[9px] text-slate-400">{formatDate(rec.createdAt)}</span>
                       <span className="text-[9px] uppercase font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 rounded-full">CSV RUN</span>
                    </div>

                    <div>
                      <h5 className="font-bold text-sm text-slate-800 truncate pr-6">{rec.name}</h5>
                      <span className="font-mono text-[9px] text-slate-500 block mt-0.5">{rec.resultCount} entrées consolidées</span>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Aperçu entrée</span>
                      <div className="font-mono text-[9px] text-slate-600 truncate max-w-full">
                        {rec.rawInput}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-end">
                    <button
                      onClick={() => {
                        onLoadSavedReconciliation(rec.rawInput);
                        alert(`Chargement de "${rec.name}" réussi ! Accédez à l'onglet "Projets & Diagnostics" pour voir le résultat du pipeline.`);
                      }}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-xl font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      Restaurer cette session <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL PREVIEW OVERLAY SCREEN */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  {getFileIcon(previewFile.fileType)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight pr-6">{previewFile.name}</h3>
                  <span className="font-mono text-[9px] text-slate-400 block mt-0.5">
                    Original: {previewFile.fileName} ({formatBytes(previewFile.fileSize)})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with Context-Aware Rendering */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50 flex flex-col justify-center">
              {previewFile.fileType.toLowerCase().includes('image/') ? (
                /* Dynamic Image previews */
                <div className="text-center p-2 rounded-2xl bg-white max-h-[50vh] flex items-center justify-center">
                  <img 
                    src={getFileUrl(previewFile)} 
                    referrerPolicy="no-referrer"
                    alt={previewFile.name} 
                    className="max-h-[48vh] rounded-xl object-contain shadow"
                  />
                </div>
              ) : previewFile.fileType.toLowerCase().includes('text/') || 
                  previewFile.fileType.toLowerCase().includes('json') || 
                  previewFile.fileType.toLowerCase().includes('javascript') || 
                  previewFile.fileType.toLowerCase().includes('typescript') ||
                  previewFile.fileType.toLowerCase().includes('csv') ? (
                /* Plaintext pre-formatted preview */
                <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl overflow-x-auto font-mono text-[11px] leading-relaxed max-h-[50vh]">
                  <pre className="whitespace-pre-wrap">
                    {decodeBase64Text(previewFile)}
                  </pre>
                </div>
              ) : (
                /* Non-interactive PDF or Binary Preview Cover */
                <div className="text-center py-12 px-6 rounded-2xl bg-white space-y-4 max-w-sm mx-auto shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
                    {getFileIcon(previewFile.fileType)}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800">Visualisation Binaire Limpide</h5>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Ce format de fichier ({previewFile.fileType}) est archivé de manière sécurisée mais ne supporte pas d'aperçu HTML direct.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(previewFile)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={12} /> Télécharger pour voir
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="font-mono text-[9px] text-slate-400">
                Ajouté le {formatDate(previewFile.createdAt)}
              </span>
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleDownloadFile(previewFile)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Download size={12} /> Télécharger
                </button>
                <button
                  onClick={(e) => handleDeleteFile(e, previewFile.id)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECURE DECRYPTION RETRIEVAL LOADER */}
      {isRetrieving && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center border border-slate-100 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <RefreshCw size={20} className="animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Chargement Sécurisé</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Déchiffrement et flux de transfert binaire en cours depuis Firestore...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD UNLOCK MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-slate-100 shadow-2xl relative">
            <button 
              onClick={() => {
                setShowUnlockModal(false);
                setPendingAction(null);
                setPasswordInput('');
                setPasswordError('');
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
            >
              <X size={16} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
              <Lock size={24} className="animate-pulse" />
            </div>

            <h3 className="font-bold text-base text-slate-900 leading-tight">Accès Sécurisé Requis</h3>
            <p className="text-xs text-slate-500 mt-2">
              Veuillez entrer le mot de passe d'habilitation pour prévisualiser ou télécharger ce document.
            </p>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (passwordInput === '373952') {
                  setIsUnlocked(true);
                  setShowUnlockModal(false);
                  setPasswordError('');
                  
                  // Run outstanding request
                  if (pendingAction) {
                    await executeFileAction(pendingAction.type, pendingAction.file);
                  }
                  setPendingAction(null);
                } else {
                  setPasswordError('Mot de passe incorrect d\'habilitation.');
                  setPasswordInput('');
                }
              }}
              className="mt-6 space-y-4"
            >
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Code à 6 chiffres"
                required
                autoFocus
                maxLength={20}
                className="w-full text-center tracking-[0.25em] font-mono p-3 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 rounded-xl outline-none text-sm transition-all"
              />

              {passwordError && (
                <p className="text-[11px] text-rose-600 font-bold bg-rose-50 py-1.5 px-3 rounded-lg border border-rose-100">
                  ⚠️ {passwordError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
              >
                Déverrouiller le Document
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
