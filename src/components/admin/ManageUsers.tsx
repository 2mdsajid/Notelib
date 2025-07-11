import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Mail, CalendarDays, UserCheck, ShieldCheck, Trash2, AlertCircle, Download, CheckCircle, XCircle } from 'lucide-react';
import ConfirmDialog from '../ConfirmDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

interface ProfileData {
  fullName: string;
  role: string;
}

interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  profileData?: ProfileData;
  role: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  ioeAccess?: boolean;
  ceeAccess?: boolean;
  liveTestAccess?: boolean;
}

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [isConfirmAccessDialogOpen, setIsConfirmAccessDialogOpen] = useState(false);
  const [accessChangeData, setAccessChangeData] = useState<{
    userId: string;
    userName: string;
    accessType: 'ioeAccess' | 'ceeAccess' | 'liveTestAccess';
    currentValue: boolean;
  } | null>(null);
  const [exportStart, setExportStart] = useState('1');
  const [exportEnd, setExportEnd] = useState('10');
  // Filtered users must be defined before selection state
  const filteredUsers = users.filter(user => {
    const isStudent = user.role === 'student';
    const matchesSearchTerm = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profileData?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.uid?.toLowerCase().includes(searchTerm.toLowerCase());

    if (searchTerm) {
      return isStudent && matchesSearchTerm;
    }
    return isStudent; // If no search term, just filter by role
  });
  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const allSelected = filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;
  // Bulk grant live test access
  const handleBulkGrantLive = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('No users selected.');
      return;
    }
    setLoading(true);
    try {
      const updates = selectedUserIds.map(async (id) => {
        const user = users.find(u => u.id === id);
        if (user && !user.liveTestAccess) {
          await updateDoc(doc(db, 'users', id), { liveTestAccess: true });
        }
      });
      await Promise.all(updates);
      setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, liveTestAccess: true } : u));
      toast.success('Live Test Access granted to selected users.');
    } catch (e) {
      toast.error('Error granting Live Test Access.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk revoke live test access
  const handleBulkRevokeLive = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('No users selected.');
      return;
    }
    setLoading(true);
    try {
      const updates = selectedUserIds.map(async (id) => {
        const user = users.find(u => u.id === id);
        if (user && user.liveTestAccess) {
          await updateDoc(doc(db, 'users', id), { liveTestAccess: false });
        }
      });
      await Promise.all(updates);
      setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, liveTestAccess: false } : u));
      toast.success('Live Test Access revoked for selected users.');
    } catch (e) {
      toast.error('Error revoking Live Test Access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(usersQuery);
      const usersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || 'N/A',
          email: data.email || 'N/A',
          displayName: data.displayName || data.name || 'N/A', // Updated to fallback to data.name
          profileData: data.profileData,
          role: data.profileData?.role || data.role || 'student',
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          ioeAccess: data.ioeAccess || false,
          ceeAccess: data.ceeAccess || false,
          liveTestAccess: data.liveTestAccess || false,
        } as User;
      });
      setUsers(usersList);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (timestamp: Timestamp | Date | string | number | undefined): string => {
    if (!timestamp) {
      return 'N/A';
    }

    // Check if it's a Firestore Timestamp object (has a toDate method)
    if (typeof (timestamp as any).toDate === 'function') {
      try {
        // Ensure it's a valid date before converting
        const date = (timestamp as Timestamp).toDate();
        if (isNaN(date.getTime())) {
          console.warn("Invalid date from Firestore Timestamp:", timestamp);
          return "Invalid Date";
        }
        return date.toLocaleString();
      } catch (e) {
        console.error("Error converting Firestore Timestamp to Date:", e, timestamp);
        return "Invalid Firestore Timestamp";
      }
    }

    // Check if it's already a JavaScript Date object
    if (timestamp instanceof Date) {
      if (!isNaN(timestamp.getTime())) {
        return timestamp.toLocaleString();
      } else {
        return "Invalid JS Date";
      }
    }

    // Check if it's a string or number (e.g., ISO string or Unix timestamp in ms)
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      const date = new Date(timestamp);
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      } else {
        console.warn("Could not parse date from string/number:", timestamp);
        return "Invalid Date String/Number";
      }
    }

    console.warn('Unrecognized timestamp format:', timestamp);
    return 'Unrecognized Date Format';
  };

  const handleExportPDF = (startIdx?: number, endIdx?: number) => {
    try {
      // Set up loading state
      setLoading(true);
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Define the data to export
      const selectedUsers = startIdx !== undefined && endIdx !== undefined
        ? filteredUsers.slice(startIdx, endIdx)
        : filteredUsers;        // Map users to table format
        const tableData = selectedUsers.map(user => [
          user.displayName || 'N/A',
          user.email || 'N/A',
          user.uid || 'N/A',
          user.role || 'N/A',
          formatDate(user.createdAt),
          user.ioeAccess ? 'Yes' : 'No',
          user.ceeAccess ? 'Yes' : 'No',
          user.liveTestAccess ? 'Yes' : 'No'
        ]);
        if (tableData.length === 0) {
        toast.error('No student data available for the selected range.');
        setLoading(false);
        return;
      }
      
      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `student_users_${startIdx !== undefined ? `${startIdx + 1}-${endIdx}` : 'all'}_${dateStr}.pdf`;
      
      // PDF Document structure
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header: Add logo or title
      doc.setFontSize(22);
      doc.setTextColor(44, 62, 80); // Dark blue-gray
      doc.text('Student User Report', pageWidth / 2, 15, { align: 'center' });
      
      // Subtitle with date
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${today.toLocaleDateString()} at ${today.toLocaleTimeString()}`, pageWidth / 2, 22, { align: 'center' });
      
      // Add info about the data range
      doc.setFontSize(10);
      const rangeText = startIdx !== undefined 
        ? `Showing students ${startIdx + 1} to ${Math.min(endIdx || 0, filteredUsers.length)} of ${filteredUsers.length} total`
        : `Showing all ${filteredUsers.length} students`;
      doc.text(rangeText, pageWidth / 2, 28, { align: 'center' });
      
      // Draw a horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 32, pageWidth - 14, 32);        // @ts-ignore
        autoTable(doc, {
          head: [['Display Name', 'Email', 'User ID', 'Role', 'Created At', 'IOE Access', 'CEE Access', 'Live Test Access']],
          body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { 
          fillColor: [41, 128, 185], // Blue header
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255] // Light blue for alternate rows
        },
        margin: { top: 35, bottom: 15 },
        didDrawPage: (data) => {
          // Footer with page numbers
          const str = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.text(str, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        }
      });
      
      // Add footer text
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('© Note Library - Confidential Student Information', 14, doc.internal.pageSize.getHeight() - 10);
        // Save the PDF
      doc.save(fileName);
      
      // Success message
      toast.success(`PDF exported successfully as "${fileName}"`);
        } catch (e) {
      console.error('Error in handleExportPDF:', e);
      setError(`Failed to generate PDF: ${e instanceof Error ? e.message : String(e)}`);
      toast.error(`Error generating PDF: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };
  const handleCustomExport = () => {
    const start = parseInt(exportStart, 10) -1; // 0-indexed
    const end = parseInt(exportEnd, 10);
    if (isNaN(start) || isNaN(end) || start < 0 || end <= start || start >= filteredUsers.length) {
      toast.error('Invalid range. Please ensure start is less than end, and within the bounds of available users.');
      return;
    }
    handleExportPDF(start, Math.min(end, filteredUsers.length));
  };
  const handleDeleteUserClick = (userId: string, userEmail: string) => {
    setUserToDelete({ id: userId, email: userEmail });
    setIsConfirmDeleteDialogOpen(true);
  };
  const toggleTestSeriesAccess = async (userId: string, accessType: 'ioeAccess' | 'ceeAccess' | 'liveTestAccess', currentValue: boolean) => {
    // Find user for display name
    const user = users.find(u => u.id === userId);
    const userName = user?.displayName || user?.email || 'Unknown User';
    
    setAccessChangeData({
      userId,
      userName,
      accessType,
      currentValue
    });
    setIsConfirmAccessDialogOpen(true);
  };

  const confirmAccessChange = async () => {
    if (!accessChangeData) return;

    const { userId, accessType, currentValue } = accessChangeData;
    
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        [accessType]: !currentValue
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, [accessType]: !currentValue }
            : user
        )
      );
        const seriesName = accessType === 'ioeAccess' ? 'IOE' : accessType === 'ceeAccess' ? 'CEE' : 'Live Test';
      const action = !currentValue ? 'granted' : 'revoked';
      toast.success(`${seriesName} ${accessType === 'liveTestAccess' ? 'access' : 'test series access'} ${action} successfully.`);
      
    } catch (error) {
      console.error('Error updating access:', error);
      setError(`Failed to update test series access. Please try again.`);
    } finally {
      setIsConfirmAccessDialogOpen(false);
      setAccessChangeData(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {      setLoading(true);
      await deleteDoc(doc(db, 'users', userToDelete.id));
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      toast.success('User deleted successfully from Firestore.');
      setError(null);    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
      setError(`Failed to delete user ${userToDelete.email}. Error: ${errorMessage}`);
      toast.error(`Error deleting user: ${errorMessage}`);
    } finally {
      setLoading(false);
      setIsConfirmDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Handle select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };
  // Handle select one
  const handleSelectOne = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Users</h1>
        <p className="text-sm text-gray-600">View and manage all registered users</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start space-x-3" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>      {/* Export Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Export Student Data (PDF)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {/* Elegant Card-style Custom Range */}
          <div className="sm:col-span-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label htmlFor="exportStart" className="block text-sm font-medium text-gray-700 mb-2">Start Row</label>
                <input 
                  type="number" 
                  id="exportStart" 
                  value={exportStart} 
                  onChange={(e) => setExportStart(e.target.value)} 
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="1"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="exportEnd" className="block text-sm font-medium text-gray-700 mb-2">End Row</label>
                <input 
                  type="number" 
                  id="exportEnd" 
                  value={exportEnd} 
                  onChange={(e) => setExportEnd(e.target.value)} 
                  min={exportStart ? (parseInt(exportStart) + 1).toString() : "2"} // End must be > start
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="10"
                />
              </div>

              <div className="flex-1 sm:ml-2">
                <button 
                  onClick={handleCustomExport}
                  disabled={filteredUsers.length === 0}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> Export Range
                </button>
              </div>
            </div>
            
            {filteredUsers.length > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                Available range: 1-{filteredUsers.length} students
              </div>
            )}
          </div>
          
          {/* Export All Button */}
          <div className="sm:col-span-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
            <button 
              onClick={() => handleExportPDF()} // No args means export all
              disabled={filteredUsers.length === 0}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-300 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" /> Export All {filteredUsers.length > 0 ? `(${filteredUsers.length})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Live Test Access Controls */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <button
          onClick={handleBulkGrantLive}
          disabled={selectedUserIds.length === 0 || loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 text-sm font-medium"
        >
          Grant Live Test Access
        </button>
        <button
          onClick={handleBulkRevokeLive}
          disabled={selectedUserIds.length === 0 || loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 text-sm font-medium"
        >
          Revoke Live Test Access
        </button>
        <span className="ml-2 text-xs text-gray-500">{selectedUserIds.length} selected</span>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      aria-label="Select all users"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    User ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    IOE Access
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    CEE Access
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Live Test Access
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? 'No users found matching your search.' : 'No users found in the database.'}
                    </td>
                  </tr>
                ) : (filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleSelectOne(user.id)}
                          aria-label={`Select user ${user.displayName || user.email}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-blue-700">
                              {user.displayName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={user.displayName}>
                              {user.displayName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                              {user.profileData?.fullName || (user.displayName && user.displayName !== 'N/A' ? '' : 'Full name not set')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">                        <div className="flex items-center text-sm text-gray-500 truncate max-w-[140px]" title={user.email}>
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500 font-mono truncate max-w-[120px]" title={user.uid}>
                          {user.uid}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center ${ 
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleTestSeriesAccess(user.id, 'ioeAccess', user.ioeAccess || false)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            user.ioeAccess 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={`${user.ioeAccess ? 'Revoke' : 'Grant'} IOE access`}
                        >
                          {user.ioeAccess ? (
                            <span className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Granted
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <XCircle className="w-3 h-3 mr-1" />
                              Denied
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleTestSeriesAccess(user.id, 'ceeAccess', user.ceeAccess || false)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            user.ceeAccess 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={`${user.ceeAccess ? 'Revoke' : 'Grant'} CEE access`}
                        >
                          {user.ceeAccess ? (
                            <span className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Granted
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <XCircle className="w-3 h-3 mr-1" />
                              Denied
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleTestSeriesAccess(user.id, 'liveTestAccess', user.liveTestAccess || false)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            user.liveTestAccess 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={`${user.liveTestAccess ? 'Revoke' : 'Grant'} Live Test access`}
                        >
                          {user.liveTestAccess ? (
                            <span className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Granted
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <XCircle className="w-3 h-3 mr-1" />
                              Denied
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteUserClick(user.id, user.email)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1.5 rounded-md hover:bg-red-100"
                          title={`Delete user ${user.email}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}      <ConfirmDialog
        isOpen={isConfirmDeleteDialogOpen}
        onClose={() => setIsConfirmDeleteDialogOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Confirm User Deletion"
        message={`Are you sure you want to delete user ${userToDelete?.email}? This action cannot be undone.`}
        confirmButtonText="Delete"
      />
      
      <ConfirmDialog
        isOpen={isConfirmAccessDialogOpen}
        onClose={() => {
          setIsConfirmAccessDialogOpen(false);
          setAccessChangeData(null);
        }}
        onConfirm={confirmAccessChange}
        title="Confirm Access Change"
        message={
          accessChangeData
            ? `Are you sure you want to ${accessChangeData.currentValue ? 'revoke' : 'grant'} ${
                accessChangeData.accessType === 'ioeAccess' ? 'IOE' : 
                accessChangeData.accessType === 'ceeAccess' ? 'CEE' : 'Live Test'
              } ${accessChangeData.accessType === 'liveTestAccess' ? 'access' : 'test series access'} for ${accessChangeData.userName}?`
            : ''
        }
        confirmButtonText={accessChangeData?.currentValue ? 'Revoke Access' : 'Grant Access'}
      />
    </div>
  );
};

export default ManageUsers;