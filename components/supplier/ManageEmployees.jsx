import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  doc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import CreatableSelect from "react-select/creatable";
import { useTranslation } from "react-i18next";

// Predefined Role Options
const roleOptions = [
  { value: "Supplier Admin", label: "Supplier Admin" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "Order Manager", label: "Order Manager" },
  {
    value: "Customer Service Representative",
    label: "Customer Service Representative",
  },
  { value: "Inventory Coordinator", label: "Inventory Coordinator" },
];

const ManageEmployees = ({ supplierId: passedSupplierId }) => {
  const { t } = useTranslation(); // Initialize translation
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    email: "",
    username: "",
    password: "",
  });
  const [editMode, setEditMode] = useState(null);
  const [supplierId, setSupplierId] = useState(passedSupplierId || null);

  const auth = getAuth();

  // Fetch employees for the supplier
  const fetchEmployees = useCallback(async () => {
    if (!supplierId) {
      console.error(t("errors.missing_supplier_id"));
      return;
    }

    try {
      const q = query(
        collection(db, "employees"),
        where("supplierId", "==", supplierId)
      );
      const data = await getDocs(q);
      setEmployees(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error(t("errors.fetch_employees_error"), error);
    }
  }, [supplierId, t]);

  // Fetch supplier ID via authentication if not passed
  useEffect(() => {
    if (!passedSupplierId) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setSupplierId(user.uid);
        } else {
          console.error(t("errors.user_not_authenticated"));
        }
      });
      return () => unsubscribe();
    }
  }, [auth, passedSupplierId, t]);

  // Fetch employees when supplierId changes
  useEffect(() => {
    if (supplierId) {
      fetchEmployees();
    }
  }, [supplierId, fetchEmployees]);

  const addEmployee = async () => {
    if (!supplierId) {
      console.error(t("errors.missing_supplier_id"));
      return;
    }

    if (
      !newEmployee.name.trim() ||
      !newEmployee.role.trim() ||
      !newEmployee.email.trim() ||
      !newEmployee.username.trim() ||
      !newEmployee.password.trim()
    ) {
      console.error(t("errors.all_fields_required"));
      return;
    }

    try {
      const employeeData = { ...newEmployee, supplierId };
      await addDoc(collection(db, "employees"), employeeData);
      console.log(t("employees.messages.added"));
      fetchEmployees();
      resetForm();
    } catch (error) {
      console.error(t("errors.add_employee_error"), error);
    }
  };

  const updateEmployee = async (id) => {
    try {
      const employeeDoc = doc(db, "employees", id);
      await updateDoc(employeeDoc, newEmployee);
      console.log(t("employees.messages.updated"));
      fetchEmployees();
      resetForm();
      setEditMode(null);
    } catch (error) {
      console.error(t("errors.update_employee_error"), error);
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const employeeDoc = doc(db, "employees", id);
      await deleteDoc(employeeDoc);
      console.log(t("employees.messages.deleted"));
      fetchEmployees();
    } catch (error) {
      console.error(t("errors.delete_employee_error"), error);
    }
  };

  const resetForm = () => {
    setNewEmployee({
      name: "",
      role: "",
      email: "",
      username: "",
      password: "",
    });
  };

  return (
    <div>
      <h4 className='text-success fw-bold'>{t("employees.manage")}</h4>
      <p>{t("employees.description")}</p>

      <h6 className='text-muted fw-bold mt-4'>
        {editMode ? t("employees.edit") : t("employees.add")}:
      </h6>
      <div className='row g-2'>
        <div className='col-md-6'>
          <div className='mb-2'>
            <label className='form-label small'>
              {t("employees.fields.name")}
            </label>
            <input
              type='text'
              className='form-control form-control-sm'
              placeholder={t("employees.fields.enter_name")}
              value={newEmployee.name}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, name: e.target.value })
              }
            />
          </div>
          <div className='mb-2'>
            <label className='form-label small'>
              {t("employees.fields.role")}
            </label>
            <CreatableSelect
              options={roleOptions}
              placeholder={t("employees.fields.select_or_create_role")}
              value={
                newEmployee.role
                  ? { value: newEmployee.role, label: newEmployee.role }
                  : null
              }
              onChange={(selectedOption) =>
                setNewEmployee({
                  ...newEmployee,
                  role: selectedOption ? selectedOption.value : "",
                })
              }
              className='react-select-container'
              classNamePrefix='react-select'
            />
          </div>
        </div>

        <div className='col-md-6'>
          <div className='mb-2'>
            <label className='form-label small'>
              {t("employees.fields.email")}
            </label>
            <input
              type='email'
              className='form-control form-control-sm'
              placeholder={t("employees.fields.enter_email")}
              value={newEmployee.email}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, email: e.target.value })
              }
            />
          </div>
          <div className='mb-2'>
            <label className='form-label small'>
              {t("employees.fields.username")}
            </label>
            <input
              type='text'
              className='form-control form-control-sm'
              placeholder={t("employees.fields.enter_username")}
              value={newEmployee.username}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, username: e.target.value })
              }
            />
          </div>
          <div className='mb-2'>
            <label className='form-label small'>
              {t("employees.fields.password")}
            </label>
            <input
              type='password'
              className='form-control form-control-sm'
              placeholder={t("employees.fields.enter_password")}
              value={newEmployee.password}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, password: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className='mt-2'>
        <button
          className='btn btn-success btn-sm'
          onClick={editMode ? () => updateEmployee(editMode) : addEmployee}
        >
          {editMode ? t("employees.update") : t("employees.add")}
        </button>
      </div>

      <h5 className='mt-4'>{t("employees.current")}</h5>
      <table className='table table-striped table-hover'>
        <thead>
          <tr>
            <th>{t("employees.fields.name")}</th>
            <th>{t("employees.fields.role")}</th>
            <th>{t("employees.fields.email")}</th>
            <th>{t("employees.fields.username")}</th>
            <th>{t("employees.actions.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.role}</td>
              <td>{employee.email}</td>
              <td>{employee.username}</td>
              <td>
                <button
                  className='btn btn-outline-primary btn-sm me-2'
                  onClick={() => {
                    setEditMode(employee.id);
                    setNewEmployee(employee);
                  }}
                >
                  {t("employees.actions.edit")}
                </button>
                <button
                  className='btn btn-outline-danger btn-sm'
                  onClick={() => deleteEmployee(employee.id)}
                >
                  {t("employees.actions.delete")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageEmployees;
