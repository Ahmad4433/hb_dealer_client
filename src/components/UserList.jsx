import React, { useEffect, useMemo, useState } from "react";
import "./userList.css";
import apis from "../utils/apis";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Modal, Card } from "react-bootstrap";
import httpAction from "../utils/httpAction";
import { TextField, Button } from "@mui/material";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { FaUser, FaPhoneAlt, FaBuilding, FaFileInvoice } from "react-icons/fa";
import { HiOutlineSearch } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

const UserList = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({});
  const [q, setQ] = useState("");
  const naviaget = useNavigate();

  const getUsers = async () => {
    const payload = { url: apis().userList };
    const result = await httpAction(payload);
    if (result?.status) {
      setUsers(result?.list || []);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;

    return users.filter((u) => {
      const hay = [
        u?.name,
        u?.mobile,
        u?.estate,
        u?._id,
        (u?.invoices || []).length,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [users, q]);

  const userInitialState = {
    name: user?.name || "",
    mobile: user?.mobile || "",
    estate: user?.estate || "",
  };

  const validationSchmea = Yup.object({
    name: Yup.string().required("Name is required"),
    mobile: Yup.string()
      .required("Mobile is required")
      .matches(/^\d{11}$/, "Mobile number must be exactly 11 digits"),
    estate: Yup.string().required("Estate name is required"),
  });

  const submitHandler = async (values) => {
    const data = {
      url: apis().updateUser + "?id=" + user?._id,
      method: "PUT",
      body: values,
    };
    const result = await httpAction(data);
    if (result?.status) {
      toast.success(result?.message);
      setShowEdit(false);
      const userIndex = users.findIndex((item) => item._id === user?._id);
      const coppyUsers = [...users];
      coppyUsers.splice(userIndex, 1, result?.user);
      setUsers(coppyUsers);
    }
  };

  const deleteUserHandler = async (u) => {
    const data = {
      url: apis().deleteUser + "?id=" + u?._id,
      method: "DELETE",
    };

    const result = await httpAction(data);
    if (result?.status) {
      toast.success(result?.message);
      const findedIndex = users.findIndex((item) => item._id === u?._id);
      const copyUsers = [...users];
      copyUsers.splice(findedIndex, 1);
      setUsers(copyUsers);
    }
  };

  return (
    <div className="userListPage">
      <Modal centered show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <Formik
              initialValues={userInitialState}
              validationSchema={validationSchmea}
              onSubmit={submitHandler}
            >
              {({
                handleBlur,
                handleChange,
                values,
                touched,
                errors,
                setFieldValue,
              }) => (
                <Form>
                  <div className="container-fluid">
                    <div className="row g-3 p-2">
                      <div className="col-12">
                        <TextField
                          type="text"
                          name="name"
                          label="User name"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.name}
                          fullWidth
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                        />
                      </div>
                      <div className="col-12">
                        <TextField
                          type="text"
                          name="mobile"
                          label="User Mobile Number"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.mobile}
                          fullWidth
                          error={touched.mobile && Boolean(errors.mobile)}
                          helperText={touched.mobile && errors.mobile}
                        />
                      </div>
                      <div className="col-12">
                        <TextField
                          type="text"
                          name="estate"
                          label="User Estate Name"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.estate}
                          fullWidth
                          error={touched.estate && Boolean(errors.estate)}
                          helperText={touched.estate && errors.estate}
                        />
                      </div>
                      <div className="col-12">
                        <Button type="submit" variant="contained" fullWidth>
                          update User
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </Modal.Body>
      </Modal>
      {/* Header */}
      <div className="userHeader">
        <div className="userHeaderLeft">
          <h2 className="userTitle">Users</h2>
          <p className="userSub">
            Showing <b>{filteredUsers.length}</b> users
          </p>
        </div>

        <div className="userHeaderRight">
          <div className="userSearch">
            <HiOutlineSearch className="searchIco" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, mobile, estate..."
            />
          </div>

          <button className="refreshBtn" type="button" onClick={getUsers}>
            Refresh
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="userGrid">
        {filteredUsers.map((u) => {
          const invoiceCount = (u?.invoices || []).length;

          return (
            <div key={u._id} className="userCard">
              {/* Top row */}
              <div className="userTop">
                <div className="avatar">
                  <FaUser />
                </div>

                <div className="userMeta">
                  <div className="userNameRow">
                    <h3 className="userName">{u?.name || "Unnamed"}</h3>

                    <span className="invoiceBadge">
                      <FaFileInvoice />
                      {invoiceCount} Invoices
                    </span>
                  </div>

                  <div className="userId" title={u?._id}>
                    ID: {u?._id?.slice(-10)}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="userDetails">
                <div className="detailRow">
                  <FaPhoneAlt className="rowIcon" />
                  <div className="rowText">
                    <span className="label">Mobile</span>
                    <span className="value">{u?.mobile || "-"}</span>
                  </div>
                </div>

                <div className="detailRow">
                  <FaBuilding className="rowIcon" />
                  <div className="rowText">
                    <span className="label">Estate</span>
                    <span className="value">{u?.estate || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              {/* <div className="userFooter">
                <button
                  className="miniBtn"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(u?._id)}
                  title="Copy User ID"
                >
                  Copy ID
                </button>

                <div className="hint">
                  <FaFileInvoice /> Total invoices: <b>{invoiceCount}</b>
                </div>
              </div> */}

              <div className="cardActions">
                <button
                  className="iconBtn edit"
                  title="Edit User"
                  onClick={() => {
                    setShowEdit(true);
                    setUser(u);
                  }}
                >
                  <FaEdit />
                </button>

                <button
                  className="iconBtn delete"
                  title="Delete User"
                  onClick={() => {
                    deleteUserHandler(u);
                    // TODO: delete confirmation + API
                    console.log("Delete user:", u._id);
                  }}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="emptyState">
            <div className="emptyCard">
              <FaUser className="emptyIcon" />
              <h3>No users found</h3>
              <p>Try searching with different keywords.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
