import React, { useEffect, useState } from 'react';
import { collection, getDocs, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface PaymentRequest {
  id: string;
  userId: string;
  status: string; // e.g., 'pending', 'approved', 'revoked'
  timestamp: any;
  paymentProofCpanelUrl?: string;
  paymentProofFileName?: string;
  requestedAt?: Timestamp;
  seriesPurchased?: string; // IOE, CEE, or LIVE
  userEmail?: string;
  userName?: string;
  paymentAmount?: number; // Store the amount paid
  paymentMethod?: string; // e.g., 'eSewa', 'Khalti', etc.
  submissionSource?: string; // e.g., 'web', 'mobile'
  hasAccessed?: boolean; // Whether the user has accessed the purchased content
  lastAccessDate?: Timestamp; // When the user last accessed the content
}

const AdminPaymentDetail: React.FC = () => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [seriesFilter, setSeriesFilter] = useState<string>('all');
  // Removed accessFilter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('requestedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchPaymentRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const querySnapshot = await getDocs(collection(db, 'paymentRequests'));
        // Get all payment requests
        const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRequest));
        // Fetch user access data for each request
        const usersRef = collection(db, 'users');
        const userQuerySnapshot = await getDocs(usersRef);
        const allUsers = userQuerySnapshot.docs.map(docSnap => docSnap.data());
        const requestsWithAccessInfo = requests.map((request) => {
          if (!request.userEmail) {
            return { ...request, hasAccessed: false };
          }
          const foundUser = allUsers.find(u => u.email && u.email.toLowerCase() === request.userEmail.toLowerCase());
          if (foundUser) {
            const hasAnyAccess = !!(foundUser.ioeAccess || foundUser.ceeAccess || foundUser.liveTestAccess);
            return {
              ...request,
              hasAccessed: hasAnyAccess,
              lastAccessDate: foundUser.lastLogin || null
            };
          }
          return { ...request, hasAccessed: false };
        });
        setPaymentRequests(requestsWithAccessInfo);
        setFilteredRequests(requestsWithAccessInfo); // Initialize filtered requests
      } catch (err) {
        console.error("Error fetching payment requests: ", err);
        setError('Failed to fetch payment requests.');
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentRequests();
  }, []);

  // Filter and sort effect
  useEffect(() => {
    let filtered = paymentRequests;
    // Filter by series
    if (seriesFilter !== 'all') {
      filtered = filtered.filter(request => request.seriesPurchased === seriesFilter);
    }
    // Filter by search term (user name, email, or request ID)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.userName?.toLowerCase().includes(term) ||
        request.userEmail?.toLowerCase().includes(term) ||
        request.id.toLowerCase().includes(term)
      );
    }
    // Sort the results
    filtered.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      switch (sortField) {
        case 'requestedAt':
          aValue = a.requestedAt?.toDate?.() || a.timestamp || new Date(0);
          bValue = b.requestedAt?.toDate?.() || b.timestamp || new Date(0);
          break;
        case 'userName':
          aValue = a.userName || '';
          bValue = b.userName || '';
          break;
        case 'userEmail':
          aValue = a.userEmail || '';
          bValue = b.userEmail || '';
          break;
        case 'seriesPurchased':
          aValue = a.seriesPurchased || '';
          bValue = b.seriesPurchased || '';
          break;
        case 'paymentAmount':
          aValue = a.paymentAmount || 0;
          bValue = b.paymentAmount || 0;
          break;
        case 'accessStatus':
          aValue = a.hasAccessed ? 1 : 0;
          bValue = b.hasAccessed ? 1 : 0;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    setFilteredRequests(filtered);
  }, [paymentRequests, seriesFilter, searchTerm, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading payment details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4">Error: {error}</div>;
  }

  const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp && typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleString();
    }
    if (timestamp && typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return 'N/A';
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Admin Payment Details</h2>
      
      {/* Filter Controls */}
      {paymentRequests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bulk Actions & Filter Options</h3>
          {/* Bulk Grant/Revoke Live Access Buttons */}
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold shadow"
              onClick={async () => {
                try {
                  const usersRef = collection(db, 'users');
                  const userQuerySnapshot = await getDocs(usersRef);
                  const batchUpdates: any[] = [];
                  userQuerySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.email) {
                      // Grant liveTestAccess to all users who have a payment request for LIVE
                      const hasLivePayment = paymentRequests.some(req => req.userEmail && req.userEmail.toLowerCase() === data.email.toLowerCase() && req.seriesPurchased === 'LIVE');
                      if (hasLivePayment && !data.liveTestAccess) {
                        batchUpdates.push({ id: docSnap.id, ...data });
                      }
                    }
                  });
                  for (const user of batchUpdates) {
                    const userDocRef = doc(db, 'users', user.id);
                    await updateDoc(userDocRef, { liveTestAccess: true });
                  }
                  alert(`Granted Live Test Access to ${batchUpdates.length} users.`);
                } catch (err) {
                  alert('Bulk grant failed.');
                }
              }}
            >
              Grant Live Test Access to All with LIVE Payment
            </button>
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold shadow"
              onClick={async () => {
                try {
                  const usersRef = collection(db, 'users');
                  const userQuerySnapshot = await getDocs(usersRef);
                  const batchUpdates: any[] = [];
                  userQuerySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.email) {
                      // Revoke liveTestAccess for all users who have a payment request for LIVE
                      const hasLivePayment = paymentRequests.some(req => req.userEmail && req.userEmail.toLowerCase() === data.email.toLowerCase() && req.seriesPurchased === 'LIVE');
                      if (hasLivePayment && data.liveTestAccess) {
                        batchUpdates.push({ id: docSnap.id, ...data });
                      }
                    }
                  });
                  for (const user of batchUpdates) {
                    const userDocRef = doc(db, 'users', user.id);
                    await updateDoc(userDocRef, { liveTestAccess: false });
                  }
                  alert(`Revoked Live Test Access for ${batchUpdates.length} users.`);
                } catch (err) {
                  alert('Bulk revoke failed.');
                }
              }}
            >
              Revoke Live Test Access for All with LIVE Payment
            </button>
          </div>
          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by user name, email, or request ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Series Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Series</label>
              <select
                value={seriesFilter}
                onChange={(e) => setSeriesFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Series ({paymentRequests.length})</option>
                <option value="IOE">IOE ({paymentRequests.filter(r => r.seriesPurchased === 'IOE').length})</option>
                <option value="CEE">CEE ({paymentRequests.filter(r => r.seriesPurchased === 'CEE').length})</option>
                <option value="LIVE">LIVE ({paymentRequests.filter(r => r.seriesPurchased === 'LIVE').length})</option>
              </select>
            </div>
            {/* Results Count */}
            <div className="flex items-end">
              <div className="space-y-2 w-full">
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-600">Showing Results</p>
                  <p className="text-xl font-bold text-blue-700">{filteredRequests.length}</p>
                </div>
                {(seriesFilter !== 'all' || searchTerm.trim() !== '') && (
                  <button
                    onClick={() => {
                      setSeriesFilter('all');
                      setSearchTerm('');
                    }}
                    className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {filteredRequests.length === 0 ? (
        <p className="text-center py-8 text-gray-500">
          {paymentRequests.length === 0 ? 'No payment requests found.' : 'No requests match the selected filters.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('id')}>
                  Request ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 border-b text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('userName')}>
                  User Name {sortField === 'userName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 border-b text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('userEmail')}>
                  User Email {sortField === 'userEmail' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 border-b text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('seriesPurchased')}>
                  Series Purchased {sortField === 'seriesPurchased' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                {/* Removed Amount, Payment Method, and Status columns */}
                <th className="py-2 px-4 border-b text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('accessStatus')}>
                  Access Status {sortField === 'accessStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 border-b text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('requestedAt')}>
                  Date Requested {sortField === 'requestedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 border-b text-left">Payment Proof</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{request.id}</td>
                  <td className="py-2 px-4 border-b">{request.userName || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{request.userEmail || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.seriesPurchased === 'IOE' ? 'bg-blue-100 text-blue-700' :
                      request.seriesPurchased === 'CEE' ? 'bg-green-100 text-green-700' :
                      request.seriesPurchased === 'LIVE' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {request.seriesPurchased || 'N/A'}
                    </span>
                  </td>
                  {/* Removed Amount, Payment Method, and Status columns */}
                  <td className="py-2 px-4 border-b">
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.hasAccessed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {request.hasAccessed ? 'Accessed ✓' : 'Not Accessed Yet'}
                      </span>
                      {request.hasAccessed && request.lastAccessDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last seen: {formatDate(request.lastAccessDate)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b">{formatDate(request.requestedAt || request.timestamp)}</td>
                  <td className="py-2 px-4 border-b">
                    {request.paymentProofCpanelUrl ? (
                      <a
                        href={request.paymentProofCpanelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View Proof
                      </a>
                    ) : (
                      request.paymentProofFileName || 'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDetail;
