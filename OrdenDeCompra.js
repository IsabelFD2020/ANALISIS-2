import React, { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './OrdenDeCompra.css'; 
import { db } from '../firebase';  // Importamos la configuración de Firebase
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, Timestamp } from "firebase/firestore"; 

const OrdenDeCompra = () => {
  const [orders, setOrders] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]); // Cotizaciones para el dropdown
  const [newOrder, setNewOrder] = useState({
    orderNumber: '',
    numeroCotizacion: '', // Agregamos el campo de cotización
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [showForm, setShowForm] = useState(false); // Controlar la visibilidad del formulario

  // Recuperar órdenes de Firebase cuando se carga la página
  useEffect(() => {
    const fetchOrders = async () => {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const ordersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);  // Actualizar estado con las órdenes obtenidas
    };
    fetchOrders();
  }, []);

  // Recuperar cotizaciones de Firebase y excluir las ya seleccionadas en órdenes
  useEffect(() => {
    const fetchCotizaciones = async () => {
      // Obtener todas las órdenes para comparar números de cotización usados
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const usedCotizations = ordersSnapshot.docs.map(order => order.data().numeroCotizacion);

      // Obtener todas las cotizaciones desde la colección Cotizaciones
      const querySnapshot = await getDocs(collection(db, "Cotizaciones"));
      const cotizacionesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        numeroCotizacion: doc.data().numeroCotizacion,
      }));

      // Excluir cotizaciones que ya fueron seleccionadas en alguna orden
      const availableCotizaciones = cotizacionesList.filter(cotizacion => 
        !usedCotizations.includes(cotizacion.numeroCotizacion)
      );

      setCotizaciones(availableCotizaciones); // Actualizar estado con las cotizaciones disponibles
    };

    fetchCotizaciones();
  }, [orders]); // Volver a cargar las cotizaciones si cambian las órdenes

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({
      ...newOrder,
      [name]: value
    });
  };

  // Validar si el número de orden ya existe
  const checkDuplicateOrderNumber = async (orderNumber) => {
    const ordersQuery = query(collection(db, "orders"), where("orderNumber", "==", orderNumber));
    const querySnapshot = await getDocs(ordersQuery);
    return !querySnapshot.empty; // Retorna true si el número de orden ya existe
  };

  // Guardar una nueva orden o actualizar una existente
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const currentDate = new Date(); // Fecha actual del sistema

    // Validar que el número de orden no esté duplicado
    if (!isEditing) {
      const isDuplicate = await checkDuplicateOrderNumber(newOrder.orderNumber);
      if (isDuplicate) {
        alert("El número de orden ya existe. Por favor, ingrese un número de orden diferente.");
        return;
      }
    }

    const formattedOrder = {
      ...newOrder,
      creationDate: Timestamp.fromDate(currentDate), // Guardar la fecha actual en Firebase
    };

    if (isEditing) {
      const docRef = doc(db, "orders", currentOrderId);
      await updateDoc(docRef, formattedOrder);  // Actualizar la orden en Firebase
      const updatedOrders = orders.map(order => 
        order.id === currentOrderId ? { ...formattedOrder, id: currentOrderId } : order
      );
      setOrders(updatedOrders);
    } else {
      const docRef = await addDoc(collection(db, "orders"), formattedOrder);  // Guardar la orden en Firebase
      setOrders([...orders, { ...formattedOrder, id: docRef.id }]);
    }
    setNewOrder({
      orderNumber: '',
      numeroCotizacion: '', // Restablecemos el campo de cotización
    });
    setIsEditing(false);
    setShowForm(false);  // Ocultar el formulario después de guardar
  };

  // Editar una orden existente
  const handleEditOrder = (id) => {
    const orderToEdit = orders.find(order => order.id === id);
    setNewOrder(orderToEdit);
    setIsEditing(true);
    setCurrentOrderId(id);
    setShowForm(true);  // Mostrar el formulario cuando se edite una orden
  };

  // Eliminar una orden existente
  const handleDeleteOrder = async (id) => {
    const docRef = doc(db, "orders", id);
    await deleteDoc(docRef);  // Eliminar la orden de Firebase
    const updatedOrders = orders.filter(order => order.id !== id);
    setOrders(updatedOrders);
  };

  // Restablecer el formulario y ocultarlo
  const handleCancel = () => {
    setNewOrder({
      orderNumber: '',
      numeroCotizacion: '', // Restablecemos el campo de cotización
    });
    setIsEditing(false);
    setShowForm(false);  // Ocultar el formulario
  };

  return (
    <div className="orden-compra-container">
      <h2>Gestión de Orden de Compra</h2>

      {/* Mostrar el botón de "Agregar Orden" solo si el formulario está oculto */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="submit-button">
          <i className="fas fa-plus"></i> Agregar Orden
        </button>
      )}

      {/* Mostrar el formulario solo si showForm es true */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="order-form">
          <div className="form-group">
            <label htmlFor="orderNumber">Número de Orden</label>
            <input
              type="text"
              id="orderNumber"
              name="orderNumber"
              value={newOrder.orderNumber}
              onChange={handleFormChange}
              required
            />
          </div>

          {/* Dropdown para seleccionar número de cotización */}
          <div className="form-group">
            <label htmlFor="numeroCotizacion">Número de Cotización</label>
            <select
              id="numeroCotizacion"
              name="numeroCotizacion"
              value={newOrder.numeroCotizacion}
              onChange={handleFormChange}
              required
            >
              <option value="">Seleccione una cotización</option>
              {cotizaciones.map((cotizacion) => (
                <option key={cotizacion.id} value={cotizacion.numeroCotizacion}>
                  {cotizacion.numeroCotizacion}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              <i className="fas fa-save"></i> {isEditing ? "Guardar Cambios" : "Guardar Orden"}
            </button>
            <button type="button" onClick={handleCancel} className="cancel-button">
              <i className="fas fa-times"></i> Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabla de Órdenes */}
      <table className="orders-table">
        <thead>
          <tr>
            <th>Acciones</th>
            <th>Número de Orden</th>
            <th>Fecha de Creación</th> {/* Cambio de nombre de columna */}
            <th>Número de Cotización</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={index}>
              <td className="actions-column">
                <button onClick={() => handleEditOrder(order.id)} className="edit-button">
                  <i className="fas fa-edit"></i> Editar
                </button>
                <button onClick={() => handleDeleteOrder(order.id)} className="delete-button">
                  <i className="fas fa-trash"></i> Eliminar
                </button>
              </td>
              <td>{order.orderNumber}</td>
              {/* Convertir la fecha de Timestamp a formato legible */}
              <td>{order.creationDate && order.creationDate.toDate().toLocaleDateString()}</td>
              <td>{order.numeroCotizacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdenDeCompra;
