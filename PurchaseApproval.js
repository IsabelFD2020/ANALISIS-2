import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./PurchaseApproval.css";

const PurchaseApproval = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolicitudes, setSelectedSolicitudes] = useState([]);
  const [showModifyPopup, setShowModifyPopup] = useState(false);
  const [selectedSolicitudToModify, setSelectedSolicitudToModify] = useState(null);
  const [newCantidad, setNewCantidad] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [historyChanges, setHistoryChanges] = useState([]); // Para el historial de cambios

  useEffect(() => {
    const fetchData = async () => {
      const productCollection = collection(db, "product");
      const solicitudCollection = collection(db, "Solicitud");

      const productSnapshot = await getDocs(productCollection);
      const solicitudSnapshot = await getDocs(solicitudCollection);

      let combinedData = [];

      solicitudSnapshot.forEach((solicitudDoc) => {
        const solicitudData = solicitudDoc.data();
        const productDoc = productSnapshot.docs.find(
          (doc) => doc.data().id_producto === solicitudData.ID_Solicitante
        );

        if (productDoc) {
          const productData = productDoc.data();
          combinedData.push({
            id: solicitudDoc.id,
            cantidad: productData.Cantidad || "No disponible",
            producto: productData.Producto || "Producto no disponible",
            estado: solicitudData.Estado_Solicitud,
            descripcion: solicitudData.Descripcion_Solicitud,
            id_solicitante: solicitudData.ID_Solicitante,
            id_solicitud: solicitudData.ID_Solicitud,
          });
        }
      });

      setData(combinedData);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Acción de aceptar una solicitud
  const handleAccept = async () => {
    for (const solicitudId of selectedSolicitudes) {
      const solicitud = data.find((item) => item.id === solicitudId);
      if (solicitud.estado === "Aceptada" || solicitud.estado === "Denegada") {
        alert("No se puede aceptar una solicitud que ya está aceptada o denegada.");
        continue;
      }

      const solicitudRef = doc(db, "Solicitud", solicitudId);
      await updateDoc(solicitudRef, {
        Estado_Solicitud: "Aceptada",
      });

      // Guardar el cambio en el historial
      setHistoryChanges((prevChanges) => [
        ...prevChanges,
        {
          id_solicitud: solicitud.id_solicitud,
          producto: solicitud.producto,
          cantidad: solicitud.cantidad,
          estado: "Aceptada",
          fecha: new Date().toLocaleString(),
          descripcion: solicitud.descripcion,
        },
      ]);
    }
    alert("Solicitudes aceptadas exitosamente.");
    setSelectedSolicitudes([]);
  };

  // Acción de denegar una solicitud
  const handleReject = async () => {
    for (const solicitudId of selectedSolicitudes) {
      const solicitud = data.find((item) => item.id === solicitudId);
      if (solicitud.estado === "Aceptada" || solicitud.estado === "Denegada") {
        alert("No se puede denegar una solicitud que ya está aceptada o denegada.");
        continue;
      }

      const solicitudRef = doc(db, "Solicitud", solicitudId);
      await updateDoc(solicitudRef, {
        Estado_Solicitud: "Denegada",
      });

      // Guardar el cambio en el historial
      setHistoryChanges((prevChanges) => [
        ...prevChanges,
        {
          id_solicitud: solicitud.id_solicitud,
          producto: solicitud.producto,
          cantidad: solicitud.cantidad,
          estado: "Denegada",
          fecha: new Date().toLocaleString(),
          descripcion: solicitud.descripcion,
        },
      ]);
    }
    alert("Solicitudes denegadas exitosamente.");
    setSelectedSolicitudes([]);
  };

  // Acción de eliminar una solicitud
  const handleDelete = async () => {
    for (const solicitudId of selectedSolicitudes) {
      const solicitud = data.find((item) => item.id === solicitudId);
      if (solicitud.estado === "Aceptada") {
        alert("No se puede eliminar una solicitud que ya está aceptada.");
        continue;
      }

      const solicitudRef = doc(db, "Solicitud", solicitudId);
      await deleteDoc(solicitudRef);

      // Guardar el cambio en el historial
      setHistoryChanges((prevChanges) => [
        ...prevChanges,
        {
          id_solicitud: solicitud.id_solicitud,
          producto: solicitud.producto,
          cantidad: solicitud.cantidad,
          estado: "Eliminada",
          fecha: new Date().toLocaleString(),
          descripcion: solicitud.descripcion,
        },
      ]);
    }
    alert("Solicitudes eliminadas exitosamente.");
    setSelectedSolicitudes([]);
  };

  // Función de modificar solicitud
  const handleModify = async () => {
    if (!selectedSolicitudToModify) return;

    const solicitudRef = doc(db, "Solicitud", selectedSolicitudToModify.id);
    const productRef = doc(db, "product", selectedSolicitudToModify.id_solicitante);

    try {
      await updateDoc(solicitudRef, {
        Descripcion_Solicitud: newDescripcion,
      });

      await updateDoc(productRef, {
        Cantidad: newCantidad,
      });

      // Guardar cambios en el historial
      setHistoryChanges((prevChanges) => [
        ...prevChanges,
        {
          id_solicitud: selectedSolicitudToModify.id_solicitud,
          producto: selectedSolicitudToModify.producto,
          cantidad: newCantidad,
          estado: selectedSolicitudToModify.estado,
          fecha: new Date().toLocaleString(),
          descripcion: newDescripcion,
        },
      ]);

      alert("Solicitud modificada exitosamente.");
      setShowModifyPopup(false);
      setSelectedSolicitudes([]); // Limpiar selección
    } catch (error) {
      console.error("Error al modificar la solicitud:", error);
      alert("Error al modificar la solicitud.");
    }
  };

  // Generar el reporte del historial de cambios
  const handleGenerateReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Cambios en Solicitudes", 14, 22);

    const headers = [["ID Solicitud", "Producto", "Cantidad", "Nuevo Estado", "Fecha", "Detalles"]];
    const rows = historyChanges.map((change) => [
      change.id_solicitud,
      change.producto,
      change.cantidad,
      change.estado,
      change.fecha,
      `Cantidad: ${change.cantidad}, Descripción: ${change.descripcion}`,
    ]);

    doc.autoTable({
      startY: 30,
      head: headers,
      body: rows,
    });

    doc.save("reporte_cambios_solicitudes.pdf");
  };

  return (
    <div className="purchase-approval-container">
      {/* Encabezado agregado */}
      <header className="page-header">
        <h1>Gestión de Solicitudes de Compra</h1>
        <p>Administre, acepte, modifique o rechace las solicitudes de compra y genere reportes detallados de los cambios realizados.</p>
      </header>

      <div className="side-buttons">
        <button
          className={`btn-modify ${selectedSolicitudes.length === 1 ? "btn-blue" : "btn-disabled"}`}
          onClick={() => setShowModifyPopup(true)}
          disabled={selectedSolicitudes.length !== 1}
        >
          <i className="fas fa-edit"></i> Modificar
        </button>
        <button
          className={`btn-accept ${selectedSolicitudes.length > 0 ? "btn-blue" : "btn-disabled"}`}
          onClick={handleAccept}
          disabled={selectedSolicitudes.length === 0}
        >
          <i className="fas fa-check"></i> Aceptar
        </button>
        <button
          className={`btn-reject ${selectedSolicitudes.length > 0 ? "btn-blue" : "btn-disabled"}`}
          onClick={handleReject}
          disabled={selectedSolicitudes.length === 0}
        >
          <i className="fas fa-times"></i> Denegar
        </button>
        <button
          className={`btn-delete ${selectedSolicitudes.length > 0 ? "btn-delete-active" : "btn-disabled"}`}
          onClick={handleDelete}
          disabled={selectedSolicitudes.length === 0}
        >
          <i className="fas fa-trash"></i> Eliminar
        </button>
        <button className="btn-blue" onClick={handleGenerateReport}>
          <i className="fas fa-file-alt"></i> Generar Reporte PDF
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Seleccionar</th>
            <th>ID Solicitud</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Descripción</th>
            <th>ID Solicitante</th>
          </tr>
        </thead>
        <tbody>
          {data.map((detail) => (
            <tr key={detail.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedSolicitudes.includes(detail.id)}
                  onChange={() => {
                    if (selectedSolicitudes.includes(detail.id)) {
                      setSelectedSolicitudes(selectedSolicitudes.filter((id) => id !== detail.id));
                    } else {
                      setSelectedSolicitudes([...selectedSolicitudes, detail.id]);
                    }
                  }}
                />
              </td>
              <td>{detail.id_solicitud}</td>
              <td>{detail.producto}</td>
              <td>{detail.cantidad}</td>
              <td>{detail.estado}</td>
              <td>{detail.descripcion}</td>
              <td>{detail.id_solicitante}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModifyPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Modificar Solicitud</h3>
            <label>
              Cantidad:
              <input
                type="number"
                value={newCantidad}
                onChange={(e) => setNewCantidad(e.target.value)}
                className="input-field"
              />
            </label>
            <label>
              Descripción:
              <textarea
                value={newDescripcion}
                onChange={(e) => setNewDescripcion(e.target.value)}
                className="input-field"
              />
            </label>
            <div className="popup-buttons">
              <button className="btn-confirm" onClick={handleModify}>
                <i className="fas fa-check"></i> Confirmar
              </button>
              <button className="btn-cancel" onClick={() => setShowModifyPopup(false)}>
                <i className="fas fa-times"></i> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseApproval;
