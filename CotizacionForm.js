import React, { useState, useEffect } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faSave, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const CotizacionForm = () => {
  const [numeroCotizacion, setNumeroCotizacion] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [fecha, setFecha] = useState('');
  const [productos, setProductos] = useState([{ producto: '', precio: '', cantidad: '', total: 0 }]);
  const [error, setError] = useState('');
  const [cotizaciones, setCotizaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      const q = query(collection(db, 'Cotizaciones'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());
      setCotizaciones(data || []);
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
      setError('Hubo un problema al cargar las cotizaciones.');
    }
  };

  const handleBuscar = async () => {
    if (!busqueda || !/^[a-zA-Z\s]*$/.test(busqueda)) {
      alert('Ingrese un proveedor válido para buscar.');
      return;
    }

    try {
      const proveedorBusqueda = busqueda.toLowerCase();
      const q = query(collection(db, 'Cotizaciones'), where('proveedor', '==', proveedorBusqueda));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());

      if (data.length === 0) {
        alert('No se encontraron cotizaciones para ese proveedor.');
        setCotizaciones([]);
      } else {
        setCotizaciones(data);
      }
    } catch (error) {
      console.error('Error al buscar cotizaciones:', error);
      setError('Hubo un problema al realizar la búsqueda.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!numeroCotizacion || !proveedor || !fecha || productos.some(p => !p.producto || !p.precio || !p.cantidad)) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    try {
      const subtotal = calcularSubtotal();

      const docRef = doc(collection(db, 'Cotizaciones'));
      await setDoc(docRef, {
        numeroCotizacion,
        proveedor: proveedor.toLowerCase(),
        fecha,
        productos,
        subtotal,
        createdAt: new Date(),
      });

      await crearSolicitudCompra(proveedor.toLowerCase(), fecha, productos, subtotal, numeroCotizacion);

      alert('Cotización guardada con éxito');
      setNumeroCotizacion('');
      setProveedor('');
      setFecha('');
      setProductos([{ producto: '', precio: '', cantidad: '', total: 0 }]);
      cargarCotizaciones();
    } catch (error) {
      console.error('Error al guardar la cotización:', error);
      setError('Hubo un problema al guardar la cotización. Intente de nuevo.');
    }
  };

  const crearSolicitudCompra = async (proveedor, fecha, productos, subtotal, numeroCotizacion) => {
    try {
      const solicitudRef = doc(collection(db, 'Solicitud'));
      await setDoc(solicitudRef, {
        proveedor,
        fecha,
        productos,
        subtotal,
        numeroCotizacion,
        estado: 'Pendiente',
        createdAt: new Date(),
      });
      console.log('Solicitud de compra creada con éxito');
    } catch (error) {
      console.error('Error al crear la solicitud de compra:', error);
    }
  };

  const addProducto = () => {
    setProductos([...productos, { producto: '', precio: '', cantidad: '', total: 0 }]);
  };

  const removeProducto = (index) => {
    const newProductos = productos.filter((_, i) => i !== index);
    setProductos(newProductos);
  };

  const handleProductoChange = (index, field, value) => {
    const newProductos = [...productos];

    if (field === 'producto' && !/^[a-zA-Z\s]*$/.test(value)) return;
    if ((field === 'precio' || field === 'cantidad') && !/^\d*$/.test(value)) return;

    newProductos[index][field] = value;

    if (newProductos[index].precio && newProductos[index].cantidad) {
      const precio = parseFloat(newProductos[index].precio);
      const cantidad = parseInt(newProductos[index].cantidad, 10);
      newProductos[index].total = precio * cantidad;
    } else {
      newProductos[index].total = 0;
    }

    setProductos(newProductos);
  };

  const handleInputChange = (setter) => (e) => {
    const value = e.target.value;
    if (!/^[a-zA-Z\s]*$/.test(value)) return;
    setter(value);
  };

  const calcularSubtotal = () => {
    return productos.reduce((subtotal, producto) => subtotal + producto.total, 0);
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <button style={styles.sidebarButton} onClick={handleSubmit}>
          <FontAwesomeIcon icon={faSave} /> Guardar Cambios
        </button>
        <button style={styles.sidebarButton} onClick={() => navigate('/historial')}>
          <FontAwesomeIcon icon={faSave} /> Historial de cotizaciones
        </button>
        <button style={styles.sidebarButtonDelete} onClick={() => removeProducto(0)}>
          <FontAwesomeIcon icon={faTrash} /> Eliminar
        </button>
        <button style={styles.sidebarButton} onClick={addProducto}>
          <FontAwesomeIcon icon={faPlus} /> Añadir Producto
        </button>
        <button style={styles.sidebarButton} onClick={() => navigate('/generar-reporte')}>
          <FontAwesomeIcon icon={faSearch} /> Generar Reporte
        </button>
      </div>
      <div style={styles.content}>
        <h2 style={styles.heading}>Cotizaciones</h2>

        <div style={styles.searchContainer}>
          <button style={styles.searchButton} onClick={handleBuscar}>
            <FontAwesomeIcon icon={faSearch} /> Buscar
          </button>
          <input
            type="text"
            placeholder="Buscar por proveedor"
            value={busqueda}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(value)) {
                setBusqueda(value);
              }
            }}
            style={styles.inputBuscarText}
          />
        </div>

        <div style={styles.inputRow}>
          <div style={styles.inputGroup}>
            <label>Número de Cotización</label>
            <input
              type="text"
              placeholder="Número de Cotización"
              value={numeroCotizacion}
              onChange={(e) => setNumeroCotizacion(e.target.value)}
              style={styles.inputSmall}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label>Proveedor</label>
            <input
              type="text"
              placeholder="Proveedor"
              value={proveedor}
              onChange={handleInputChange(setProveedor)}
              style={styles.inputSmall}
              required
            />
          </div>
        </div>

        <div style={styles.inputRow}>
          <div style={styles.inputGroup}>
            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={styles.inputSmall}
              required
            />
          </div>
        </div>

        <form>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Producto</th>
                <th style={styles.tableHeader}>Precio</th>
                <th style={styles.tableHeader}>Cantidad</th>
                <th style={styles.tableHeader}>Total</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod, index) => (
                <tr key={index}>
                  <td style={styles.regularColumn}>
                    <input
                      type="text"
                      value={prod.producto}
                      onChange={(e) => handleProductoChange(index, 'producto', e.target.value)}
                      style={styles.inputStandard}
                      placeholder="Producto"
                      required
                    />
                  </td>
                  <td style={styles.regularColumn}>
                    <input
                      type="text"
                      value={prod.precio}
                      onChange={(e) => handleProductoChange(index, 'precio', e.target.value)}
                      style={styles.inputStandard}
                      placeholder="Precio"
                      required
                    />
                  </td>
                  <td style={styles.regularColumn}>
                    <input
                      type="text"
                      value={prod.cantidad}
                      onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                      style={styles.inputStandard}
                      placeholder="Cantidad"
                      required
                    />
                  </td>
                  <td style={styles.regularColumn}>
                    <input
                      type="text"
                      value={prod.total}
                      readOnly
                      style={styles.inputReadOnly}
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" style={styles.regularColumn}>Subtotal</td>
                <td style={styles.regularColumn}>
                  <input
                    type="text"
                    value={calcularSubtotal()}
                    readOnly
                    style={styles.inputReadOnly}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    padding: '20px',
  },
  sidebar: {
    marginRight: '20px',
    marginTop: '150px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'start',
  },
  sidebarButton: {
    display: 'block',
    width: '150px',
    padding: '10px',
    marginBottom: '5px',
    backgroundColor: '#014ba0',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  sidebarButtonDelete: {
    display: 'block',
    width: '150px',
    padding: '10px',
    marginBottom: '5px',
    backgroundColor: '#fc4b08',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  content: {
    flex: 1,
  },
  heading: {
    textAlign: 'center',
    fontSize: '24px',
    marginBottom: '10px',
  },
  searchContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '20px',
    alignItems: 'center',
  },
  inputBuscarText: {
    padding: '8px',
    borderRadius: '12px',
    border: '1px solid #ccc',
    width: '250px',
    marginLeft: '10px',
  },
  searchButton: {
    padding: '8px 15px',
    backgroundColor: '#014ba0',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  inputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '50%',
  },
  inputSmall: {
    width: '50%',
    padding: '6px',
    borderRadius: '12px',
    border: '1px solid #ccc',
  },
  table: {
    width: '80%',
    borderCollapse: 'separate',
    borderSpacing: '0.5rem',
    marginTop: '20px',
  },
  tableHeader: {
    backgroundColor: '#ffd699',
    padding: '0.5rem',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  regularColumn: {
    backgroundColor: '#fff4e3',
    padding: '0.5rem',
  },
  inputStandard: {
    width: '100%',
    padding: '3px',
    borderRadius: '3px',
    border: '1px solid #fff4e3',
    backgroundColor: '#fff4e3',
  },
  inputReadOnly: {
    width: '100%',
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #fff4e3',
    backgroundColor: '#fff4e3',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
};

export default CotizacionForm;
