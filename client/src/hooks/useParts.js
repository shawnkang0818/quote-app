import { useEffect, useState } from "react";
import {
  createPart,
  deletePart,
  getParts,
  updatePart,
} from "../services/partsService";

const EMPTY_PART_FORM = {
  name: "",
  price: "",
  quantity: "",
};

export function useParts(adminToken) {
  const [parts, setParts] = useState([]);
  const [formData, setFormData] = useState(EMPTY_PART_FORM);
  const [editingPartId, setEditingPartId] = useState(null);
  const [inventoryError, setInventoryError] = useState("");

  const loadParts = async () => {
    try {
      const data = await getParts();
      setParts(data);
      setInventoryError("");
    } catch (error) {
      console.error(error);
      setInventoryError("Unable to load parts inventory.");
    }
  };

  // Inventory is shared by normal and admin modes, so load it as soon as the
  // dashboard opens rather than waiting for an administrator to sign in.
  useEffect(() => {
    let ignore = false;

    getParts()
      .then((data) => {
        if (!ignore) {
          setParts(data);
          setInventoryError("");
        }
      })
      .catch((error) => {
        console.error(error);
        if (!ignore) setInventoryError("Unable to load parts inventory.");
      });

    // Strict Mode may mount the hook twice in development. Ignore a response
    // belonging to a cleaned-up effect so stale data cannot replace newer data.
    return () => {
      ignore = true;
    };
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const beginEdit = (part) => {
    setEditingPartId(part._id);
    setFormData({
      name: part.name,
      price: part.price,
      quantity: part.quantity,
    });
    setInventoryError("");
  };

  const resetForm = () => {
    setEditingPartId(null);
    setFormData(EMPTY_PART_FORM);
    setInventoryError("");
  };

  const removePart = async (id) => {
    try {
      await deletePart(id, adminToken);
      await loadParts();
    } catch (error) {
      console.error(error);
      setInventoryError(error.message || "Unable to delete part.");
    }
  };

  const savePart = async (event) => {
    event.preventDefault();

    const partData = {
      name: formData.name,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
    };

    try {
      if (editingPartId) {
        await updatePart(editingPartId, partData, adminToken);
      } else {
        await createPart(partData, adminToken);
      }

      resetForm();
      await loadParts();
    } catch (error) {
      console.error(error);
      setInventoryError(error.message || "Unable to save part.");
    }
  };

  return {
    beginEdit,
    editingPartId,
    formData,
    handleFormChange,
    inventoryError,
    parts,
    removePart,
    resetForm,
    savePart,
  };
}
