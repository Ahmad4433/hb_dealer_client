import React, { useEffect, useState } from "react";
import "./invoiceForm.css";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { TextField, Autocomplete, Button, Box, Card } from "@mui/material";
import apis from "../utils/apis";
import httpAction from "../utils/httpAction";
import toast from "react-hot-toast";
const InvoiceForm = () => {
  const [users, setUsers] = useState([]);

  const invoiceInitialState = {
    saleType: "sale",
    purchase: "",
    sale: "",
    quantity: "",
    user: "",
    clientName: "",
    clientMobile: "",
    clientRefrence: "",
    comments: "",
  };

  const validationSchema = Yup.object({
    saleType: Yup.string().required("Sale type is required"),

    purchase: Yup.number()
      .typeError("Purchase must be a number")
      .positive("Price should be positive")
      .required("Purchase price required"),

    sale: Yup.number()
      .typeError("Sale must be a number")
      .when("saleType", {
        is: "sale",
        then: (schema) =>
          schema
            .positive("Sale price must be positive")
            .required("Sale price is required"),
        otherwise: (schema) => schema.notRequired(),
      }),

    quantity: Yup.number()
      .typeError("Quantity must be a number")
      .integer("Quantity must be an integer")
      .positive("Quantity must be positive")
      .required("Quantity is required"),

    user: Yup.string().required("Please select a user"),

    clientName: Yup.string()
      .trim()
      .min(2, "Client name is too short")
      .required("Client name is required"),

    clientMobile: Yup.string()
      .required("Client mobile is required")
      .matches(/^\d{11}$/, "Mobile number must be exactly 11 digits"),

    clientRefrence: Yup.string()
      .trim()
      .min(2, "Reference/Estate is too short")
      .required("Refrence/Estate is required"),
    comments: Yup.string().optional(),
  });

  const getUsers = async () => {
    const data = {
      url: apis().userList,
    };
    const result = await httpAction(data);
    if (result?.status) {
      const newList = result?.list?.map((item) => {
        return item?.name;
      });
      setUsers(newList);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const submitHandler = async (values, { resetForm }) => {
    const data = {
      url: apis().addInvoice + "?user=" + values.user,
      method: "POST",
      body: { data: values },
    };
    const result = await httpAction(data);
    if (result?.status) {
      toast.success(result?.message);
      resetForm();
    }
  };

  return (
    <Formik
      initialValues={invoiceInitialState}
      validationSchema={validationSchema}
      onSubmit={submitHandler}
    >
      {({
        handleBlur,
        handleChange,
        values,
        setFieldValue,
        touched,
        errors,
      }) => (
        <Form>
          <div className="container-fluid">
            <div className="row  p-3">
              <div className="col-md-8">
                <div className="row g-3">
                  <div className="col-6">
                    <Button
                      onClick={() => setFieldValue("saleType", "sale")}
                      fullWidth
                      variant={
                        values.saleType === "sale" ? "contained" : "outlined"
                      }
                    >
                      Sale
                    </Button>
                  </div>
                  <div className="col-6">
                    <Button
                      onClick={() => setFieldValue("saleType", "purchase")}
                      fullWidth
                      variant={
                        values.saleType === "purchase"
                          ? "contained"
                          : "outlined"
                      }
                    >
                      Purchase
                    </Button>
                  </div>
                  <Card sx={{ padding: "1rem" }}>
                    <div className="col-12">
                      <h4 className="col-12">Asset Detail</h4>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <TextField
                            type="number"
                            name="purchase"
                            label="Enter purchase price"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.purchase}
                            error={touched.purchase && Boolean(errors.purchase)}
                            helperText={touched.purchase && errors.purchase}
                            fullWidth
                          />
                        </div>
                        <div className="col-md-6">
                          <TextField
                            disabled={values.saleType === "purchase"}
                            type="number"
                            name="sale"
                            label="Enter sale price"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.sale}
                            error={touched.sale && Boolean(errors.sale)}
                            helperText={touched.sale && errors.sale}
                            fullWidth
                          />
                        </div>
                        <div className="col-md-6">
                          <TextField
                            type="number"
                            name="quantity"
                            label="Enter quantity"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.quantity}
                            error={touched.quantity && Boolean(errors.quantity)}
                            helperText={touched.quantity && errors.quantity}
                            fullWidth
                          />
                        </div>
                        <div className="col-md-6">
                          <Autocomplete
                            value={values.user}
                            options={users}
                            onChange={(e, value) => {
                              setFieldValue("user", value);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                fullWidth
                                name="user"
                                label="Select user"
                                error={touched.user && Boolean(errors.user)}
                                helperText={touched.user && errors.user}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card sx={{ padding: "1rem" }}>
                    <div className="col-12">
                      <div className="row g-3">
                        <h4>Client Detail</h4>
                        <div className="col-md-6">
                          <TextField
                            type="text"
                            name="clientName"
                            label="Enter client name"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.clientName}
                            error={
                              touched.clientName && Boolean(errors.clientName)
                            }
                            helperText={touched.clientName && errors.clientName}
                            fullWidth
                          />
                        </div>
                        <div className="col-md-6">
                          <TextField
                            type="numbrer"
                            name="clientMobile"
                            label="Enter client mobile number"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.clientMobile}
                            error={
                              touched.clientMobile &&
                              Boolean(errors.clientMobile)
                            }
                            helperText={
                              touched.clientMobile && errors.clientMobile
                            }
                            fullWidth
                          />
                        </div>
                        <div className="col-12">
                          <TextField
                            type="text"
                            name="clientRefrence"
                            label="Enter client refrence/estate"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.clientRefrence}
                            error={
                              touched.clientRefrence &&
                              Boolean(errors.clientRefrence)
                            }
                            helperText={
                              touched.clientRefrence && errors.clientRefrence
                            }
                            fullWidth
                          />
                        </div>
                        <div className="col-12">
                          <Field name="comments">
                            {({ field, meta }) => (
                              <TextField
                                onChange={handleChange}
                                {...field}
                                label="Remarks optional"
                                fullWidth
                                multiline
                                rows={4}
                              />
                            )}
                          </Field>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              <div className="col-md-4">
                <div className="row g-3">
                  <Card sx={{ padding: "1rem" }}>
                    <div className="col-12">
                      <div className="row g-3">
                        <h4>Invoice Total</h4>
                        <div className="col-6">
                          <span className="me-2">Profit</span>
                          <strong>
                            {values.saleType === "purchase"
                              ? "0"
                              : values.sale * values.quantity -
                                values.purchase * values.quantity}
                          </strong>
                        </div>
                        <div className="col-6">
                          <span className="me-2">Grande Total</span>
                          <strong>
                            {values.saleType === "sale"
                              ? values.sale * values.quantity
                              : values.purchase * values.quantity}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </Card>
                  <div className="col-12 p-0">
                    <Button type="submit" variant="contained" fullWidth>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default InvoiceForm;
