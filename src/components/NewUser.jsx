import React, { useEffect, useMemo, useState } from "react";
import { TextField, Button } from "@mui/material";
import "./newUser.css";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import apis from "../utils/apis";
import httpAction from "../utils/httpAction";
import toast from "react-hot-toast";
const NewUser = () => {
  const userInitialState = {
    name: "",
    mobile: "",
    estate: "",
  };

  const validationSchmea = Yup.object({
    name: Yup.string().required("Name is required"),
    mobile: Yup.string()
      .required("Mobile is required")
      .matches(/^\d{11}$/, "Mobile number must be exactly 11 digits"),
    estate: Yup.string().required("Estate name is required"),
  });

  const navigate = useNavigate();

  const submitHandler = async (values) => {
    const data = {
      url: apis().addUser,
      method: "POST",
      body: { data: values },
    };
    const result = await httpAction(data);
    if (result?.status) {
      toast.success(result?.message);
      navigate("/");
    }
  };

  return (
    <div className="user-main">
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
            <Card>
              <div className="container-fluid">
                <div className="row g-3 p-2">
                  <h4 style={{ textAlign: "center", color: "gray" }}>
                    Registe a new user
                  </h4>
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
                      Add User
                    </Button>
                  </div>
                  <Link style={{ textAlign: "center" }} to="/">
                    Back to Home?
                  </Link>
                </div>
              </div>
            </Card>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default NewUser;
