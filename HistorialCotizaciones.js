import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const HistorialCotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      const q = collection(db, 'Cotizaciones');
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCotizaciones(data || []);
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
      setError('Hubo un problema al cargar las cotizaciones.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Historial de Cotizaciones</h2>
      {error && <p style={styles.error}>{error}</p>}
      {cotizaciones.length === 0 ? (
        <p>No hay cotizaciones disponibles.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Número de Cotización</th>
              <th style={styles.tableHeader}>Proveedor</th>
              <th style={styles.tableHeader}>Fecha</th>
              <th style={styles.tableHeader}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map((cotizacion) => (
              <tr key={cotizacion.id}>
                <td style={styles.regularColumn}>{cotizacion.numeroCotizacion}</td>
                <td style={styles.regularColumn}>{cotizacion.proveedor}</td>
                <td style={styles.regularColumn}>{cotizacion.fecha}</td>
                <td style={styles.regularColumn}>{cotizacion.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    border: 'none', // Eliminar borde de la tabla
  },
  tableHeader: {
    backgroundColor: '#ffd699',
    padding: '0.5rem',
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottom: '2px solid white', // Separar con borde blanco
  },
  regularColumn: {
    backgroundColor: '#fff4e3',
    padding: '0.5rem',
    borderBottom: '2px solid white', // Separar con borde blanco
  },
  error: {
    color: 'red',
  },
};

export default HistorialCotizaciones;
