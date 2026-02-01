import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  FileDown,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { adminAPI } from "../services/api";

const Admin_Directory = () => {
  const [alumniData, setAlumniData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 100,
    totalPages: 0,
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const departments = [
    "All",
    "Computer Science and Engineering",
    "Information Technology",
    "Electrical Engineering",
    "Electronics and Communication",
    "Mechanical Engineering",
  ];

  // Fetch directory data
  const fetchDirectory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filterDept && filterDept !== "All") {
        params.department = filterDept;
      }

      const response = await adminAPI.getDirectory(params);

      if (response.success) {
        setAlumniData(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching directory:", err);
      setError("Failed to load directory data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchDirectory();
  }, [searchTerm, filterDept]);

  // Handle Excel export
  const handleExportExcel = async () => {
    try {
      const blob = await adminAPI.exportDirectoryExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'directory_export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Delay revocation to ensure browser starts download
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Error exporting Excel:", err);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      const blob = await adminAPI.exportDirectoryCSV();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'directory_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Delay revocation to ensure browser starts download
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Failed to export CSV file. Please try again.");
    }
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      const { blob, headers } = await adminAPI.exportDirectoryPDF();

      // Try to extract filename from Content-Disposition header
      let filename = 'directory_export.pdf'; // default filename
      const contentDisposition = headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Force download by changing MIME type to application/octet-stream
      // This bypasses Chrome's PDF viewer and forces a download
      const downloadBlob = new Blob([blob], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // Add to DOM and trigger click
      document.body.appendChild(link);
      link.click();

      // Keep the blob URL alive longer for Chrome (5 seconds)
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 5000);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Failed to export PDF file. Please try again.");
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle CSV import
  const handleImportCSV = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    try {
      setImporting(true);
      const response = await adminAPI.importDirectoryCSV(selectedFile);

      if (response.success) {
        setImportResults(response.data);
        setSelectedFile(null);
        // Refresh directory after import
        fetchDirectory();
      }
    } catch (err) {
      console.error("Error importing CSV:", err);
      alert(err.response?.data?.message || "Failed to import CSV file. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // Close import modal
  const closeImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setImportResults(null);
  };

  // Filter data (now done on backend, but keep for consistency)
  const filteredData = alumniData;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 relative">
      <Navbar />
      {/* Header */}
      <header className="pt-20 mb-8">
        <h1 className="text-3xl font-bold">
          ANALYTICS <span className="block font-light">DIRECTORY</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          manage and track your alumni here
        </p>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-xl border border-gray-700 transition"
        >
          <FileSpreadsheet size={18} /> Export Excel
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-xl border border-gray-700 transition"
        >
          <FileText size={18} /> Export CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-xl border border-gray-700 transition"
        >
          <FileDown size={18} /> Export PDF
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-xl border border-gray-700 transition"
        >
          <Upload size={18} /> Upload CSV
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search name or email"
            className="bg-gray-800 text-white placeholder-gray-500 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        <div className="flex items-center bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
          <Filter size={18} className="mr-2 text-gray-400" />
          <select
            className="bg-gray-800 text-white focus:outline-none"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            {departments.map((dept, i) => (
              <option key={i} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Department</th>
              <th className="px-6 py-3 text-left">Year</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  Loading directory...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-800 transition duration-150 cursor-pointer"
                  onClick={() => setSelectedProfile(row)}
                >
                  <td className="px-6 py-3">{row.name}</td>
                  <td className="px-6 py-3">{row.email}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${row.role === 'alumni'
                      ? 'bg-indigo-900/50 text-indigo-300'
                      : 'bg-green-900/50 text-green-300'
                      }`}>
                      {row.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">{row.department || 'N/A'}</td>
                  <td className="px-6 py-3">{row.year || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={() => setSelectedProfile(null)}
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-semibold mb-2">
              {selectedProfile.name}
            </h2>
            <p className="text-gray-400 mb-4">{selectedProfile.email}</p>

            <div className="space-y-3 text-sm">
              {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-indigo-400">Skills:</h3>
                  <p>{selectedProfile.skills.join(", ")}</p>
                </div>
              )}

              {selectedProfile.projects && selectedProfile.projects.length > 0 && (
                <div>
                  <h3 className="font-semibold text-indigo-400">Projects:</h3>
                  <ul className="list-disc ml-5">
                    {selectedProfile.projects.map((proj, i) => (
                      <li key={i}>{proj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProfile.education && (
                <div>
                  <h3 className="font-semibold text-indigo-400">Education:</h3>
                  <p>{selectedProfile.education}</p>
                </div>
              )}

              {selectedProfile.experience && (
                <div>
                  <h3 className="font-semibold text-indigo-400">Experience:</h3>
                  <p>{selectedProfile.experience}</p>
                </div>
              )}

              {selectedProfile.current_company && (
                <div>
                  <h3 className="font-semibold text-indigo-400">Current Company:</h3>
                  <p>{selectedProfile.current_company}</p>
                </div>
              )}

              {selectedProfile.current_position && (
                <div>
                  <h3 className="font-semibold text-indigo-400">Current Position:</h3>
                  <p>{selectedProfile.current_position}</p>
                </div>
              )}

              {selectedProfile.location && (
                <div>
                  <h3 className="font-semibold text-indigo-400">Location:</h3>
                  <p>{selectedProfile.location}</p>
                </div>
              )}

              {selectedProfile.bio && (
                <div>
                  <h3 className="font-semibold text-indigo-400">Bio:</h3>
                  <p>{selectedProfile.bio}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-indigo-400">Department:</h3>
                <p>{selectedProfile.department || 'N/A'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-indigo-400">Year:</h3>
                <p>{selectedProfile.year || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-xl relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={closeImportModal}
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-semibold mb-6">
              Import Users from CSV
            </h2>

            {!importResults ? (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-indigo-400 mb-2">CSV Format Requirements:</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    Your CSV file should have the following columns:
                  </p>
                  <ul className="text-sm text-gray-400 list-disc ml-5 space-y-1">
                    <li><strong>Required:</strong> Name, Email, Role (alumni/student), Department, Year</li>
                    <li><strong>Optional:</strong> Skills (semicolon-separated), Company, Position, Location</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Imported users will have a default password "changeme123" that they should change on first login.
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload size={48} className="text-gray-400 mb-3" />
                    <span className="text-gray-300 font-medium">
                      {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                    </span>
                    <span className="text-gray-500 text-sm mt-1">
                      Maximum file size: 5MB
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleImportCSV}
                    disabled={!selectedFile || importing}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${!selectedFile || importing
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                  >
                    {importing ? 'Importing...' : 'Import CSV'}
                  </button>
                  <button
                    onClick={closeImportModal}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg text-white font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-900/30 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                  <p className="font-semibold">Import Completed!</p>
                  <p className="text-sm mt-1">
                    {importResults.imported} records imported successfully
                    {importResults.skipped > 0 && `, ${importResults.skipped} skipped (duplicates)`}
                  </p>
                </div>

                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <h3 className="font-semibold text-red-300 mb-2">
                      Errors ({importResults.errors.length}):
                    </h3>
                    <div className="space-y-2">
                      {importResults.errors.map((error, idx) => (
                        <div key={idx} className="text-sm text-red-200 bg-red-900/20 p-2 rounded">
                          <span className="font-semibold">Row {error.row}:</span> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={closeImportModal}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg text-white font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Directory;
