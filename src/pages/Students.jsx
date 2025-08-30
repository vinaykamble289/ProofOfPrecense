import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Camera, UserPlus, Edit, Trash2, Search, Filter, X, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    class: '',
    section: '',
    phone: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    photoURL: ''
  });

  // Load students from Firebase
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const studentsData = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
    setPhotoPreview('');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        setPhotoFile(blob);
        setPhotoPreview(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.8);
      
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Upload photo to Firebase Storage
  const uploadPhoto = async (file) => {
    if (!file) return '';
    
    try {
      const fileName = `students/${Date.now()}_${file.name || 'photo.jpg'}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      return '';
    }
  };

  // Form handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      rollNumber: '',
      class: '',
      section: '',
      phone: '',
      address: '',
      guardianName: '',
      guardianPhone: '',
      photoURL: ''
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setEditingStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.rollNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      let photoURL = formData.photoURL;
      
      // Upload new photo if captured/selected
      if (photoFile) {
        photoURL = await uploadPhoto(photoFile);
      }

      const studentData = {
        ...formData,
        photoURL,
        fullName: `${formData.firstName} ${formData.lastName}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingStudent) {
        // Update existing student
        await updateDoc(doc(db, 'students', editingStudent.id), studentData);
        toast.success('Student updated successfully');
      } else {
        // Add new student
        await addDoc(collection(db, 'students'), studentData);
        toast.success('Student added successfully');
      }

      setShowModal(false);
      resetForm();
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error('Failed to save student');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      rollNumber: student.rollNumber || '',
      class: student.class || '',
      section: student.section || '',
      phone: student.phone || '',
      address: student.address || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      photoURL: student.photoURL || ''
    });
    setPhotoPreview(student.photoURL || '');
    setShowModal(true);
  };

  const handleDelete = async (studentId, photoURL) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        // Delete photo from storage if exists
        if (photoURL) {
          try {
            const photoRef = ref(storage, photoURL);
            await deleteObject(photoRef);
          } catch (error) {
            console.error('Error deleting photo:', error);
          }
        }

        // Delete student document
        await deleteDoc(doc(db, 'students', studentId));
        toast.success('Student deleted successfully');
        loadStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student');
      }
    }
  };

  // Filter and search
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterRole === 'all' || student.class === filterRole;
    
    return matchesSearch && matchesFilter;
  });

  const classes = [...new Set(students.map(s => s.class).filter(Boolean))];

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Students</h1>
            <p className="text-text-secondary mt-2">Manage student information and records</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Student
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-bg-secondary rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="form-input"
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
          </div>
        ) : (
          <div className="bg-bg-secondary rounded-lg overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary text-lg">No students found</p>
                <p className="text-text-tertiary mt-2">Add your first student to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="text-left p-4 text-text-primary font-medium">Photo</th>
                      <th className="text-left p-4 text-text-primary font-medium">Name</th>
                      <th className="text-left p-4 text-text-primary font-medium">Roll No</th>
                      <th className="text-left p-4 text-text-primary font-medium">Class</th>
                      <th className="text-left p-4 text-text-primary font-medium">Contact</th>
                      <th className="text-left p-4 text-text-primary font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-bg-tertiary/50">
                        <td className="p-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-tertiary">
                            {student.photoURL ? (
                              <img
                                src={student.photoURL}
                                alt={student.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                                <UserPlus className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-text-primary">{student.fullName}</p>
                            <p className="text-sm text-text-secondary">{student.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-primary/10 text-accent-primary">
                            {student.rollNumber}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-text-primary">{student.class}</span>
                          {student.section && (
                            <span className="text-text-secondary ml-1">- {student.section}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-text-primary">{student.phone}</p>
                            <p className="text-sm text-text-secondary">{student.guardianPhone}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(student)}
                              className="btn btn-secondary btn-sm"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(student.id, student.photoURL)}
                              className="btn btn-danger btn-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-bg-secondary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-text-primary">
                    Student Photo *
                  </label>
                  
                  {!isCapturing && !photoPreview && (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="btn btn-secondary"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Take Photo
                      </button>
                      <label className="btn btn-secondary cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        Upload Photo
                      </label>
                    </div>
                  )}

                  {/* Camera View */}
                  {isCapturing && (
                    <div className="space-y-4">
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full max-w-md rounded-lg"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="btn btn-primary"
                        >
                          Capture Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo Preview */}
                  {photoPreview && (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview('');
                            setPhotoFile(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-text-secondary">
                        Photo captured/uploaded successfully
                      </p>
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Roll Number *</label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <input
                      type="text"
                      name="class"
                      value={formData.class}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g., 10th, 11th, 12th"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g., A, B, C"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Guardian Name</label>
                    <input
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Guardian Phone</label>
                    <input
                      type="tel"
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    {editingStudent ? 'Update Student' : 'Add Student'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
