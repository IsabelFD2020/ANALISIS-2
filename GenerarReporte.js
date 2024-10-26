import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const GenerarReporte = () => {
  const [numeroCotizacion, setNumeroCotizacion] = useState('');
  const [reporteData, setReporteData] = useState(null);
  const [error, setError] = useState('');

  const handleBuscar = async () => {
    if (!numeroCotizacion) {
      setError('Por favor, ingrese un número de cotización.');
      return;
    }

    try {
      const q = query(collection(db, 'Cotizaciones'), where('numeroCotizacion', '==', numeroCotizacion));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (data.length === 0) {
        setError('No se encontró una cotización con ese número.');
        setReporteData(null);
      } else {
        setError('');
        setReporteData(data[0]); // Asignar la primera cotización encontrada
      }
    } catch (error) {
      console.error('Error al buscar la cotización:', error);
      setError('Hubo un problema al buscar la cotización.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Generar Reporte</h2>
      <input
        type="text"
        placeholder="Número de Cotización"
        value={numeroCotizacion}
        onChange={(e) => setNumeroCotizacion(e.target.value)}
        style={styles.input}
      />
      <button style={styles.button} onClick={handleBuscar}>Buscar Reporte</button>

      {error && <p style={styles.error}>{error}</p>}

      {reporteData && (
        <div style={styles.reporte}>
          <h3>Detalles de Cotización</h3>
          <p>Número de Cotización: {reporteData.numeroCotizacion}</p>
          <p>Proveedor: {reporteData.proveedor}</p>
          <p>Fecha: {reporteData.fecha}</p>
          <p>Subtotal: {reporteData.subtotal}</p>
          <h4>Productos:</h4>
          <ul>
            {reporteData.productos.map((producto, index) => (
              <li key={index}>
                {producto.producto} - Precio: {producto.precio} - Cantidad: {producto.cantidad} - Total: {producto.total}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    marginTop: '20px',
  },
  input: {
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginRight: '10px',
  },
  button: {
    padding: '8px 15px',
    backgroundColor: '#014ba0',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
  },
  reporte: {
    marginTop: '20px',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#fff',
  },
};

export default GenerarReporte;
