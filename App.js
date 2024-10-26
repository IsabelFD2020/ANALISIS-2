import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Importa la configuración de Firebase
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'employees'));
        const employeeData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setEmployees(employeeData);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  const addEmployee = async (employee) => {
    try {
      const docRef = await addDoc(collection(db, 'employees'), employee);
      const newEmployee = { ...employee, id: docRef.id };
      setEmployees([...employees, newEmployee]);
      console.log(docRef);
      setIsFormVisible(false); // Cierra el formulario después de agregar
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const updateEmployee = async (employee) => {
    try {
      const employeeRef = doc(db, 'employees', employee.id);
      await updateDoc(employeeRef, employee);
      setEmployees(
        employees.map((emp) => (emp.id === employee.id ? employee : emp))
      );
      setIsFormVisible(false); // Cierra el formulario después de editar
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const employeeRef = doc(db, 'employees', id);
      await deleteDoc(employeeRef);
      setEmployees(employees.filter((emp) => emp.id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

const saveEmployee = async () => {
    try {
        if (isEditing) {
            await updateEmployee(currentEmployee);
        } else {
            await addEmployee(currentEmployee);
        }
        setCurrentEmployee(null);
        setIsFormVisible(false);
    } catch (error) {
        console.error('Error saving employee:', error);
    }
};


  const editEmployee = (employee) => {
    setCurrentEmployee(employee);
    setIsEditing(true);
    setIsFormVisible(true);
  };

  const cancelEdit = () => {
    setIsFormVisible(false);
    setCurrentEmployee(null);
    setIsEditing(false);
  };

  const handleSearch = (e) => {
    //console.log(e.target.value);
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())||
    employee.status.toLowerCase().includes(searchTerm.toLowerCase())||
    employee.id.toLowerCase().includes(searchTerm.toLowerCase())
  
  );

  return (
    <div className="container">
      {isFormVisible ? (
        <EmployeeForm
          currentEmployee={currentEmployee || { id: '', name: '', role: '', status: 'Activo' }}
          setCurrentEmployee={setCurrentEmployee}
          onSave={saveEmployee}
          onCancel={cancelEdit}
        />
      ) : (
        <EmployeeList
          employees={filteredEmployees}
          onEdit={editEmployee}
          onDelete={deleteEmployee}
          onAdd={() => {
            setCurrentEmployee({ id: '', name: '', role: '', status: 'Activo' });
            setIsFormVisible(true);
            setIsEditing(false);
          }}
          onSearch={handleSearch}
        />
      )}
    </div>
  );
};

export default App;
