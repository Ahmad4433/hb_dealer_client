import React, { useState } from "react";
import "./header.css";
import { Card } from "react-bootstrap";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
const Header = () => {
  const [header, setHeader] = useState([
    { title: "Create Invoice", to: "/" },
    { title: "Add New User", to: "/user/create" },
    { title: "Invoice List", to: "/invoice/list" },
    { title: "User List", to: "/user/list" },
  ]);
  const [selected, setSelected] = useState("Create Invoice");
  const navigate = useNavigate();
  return (
    <div className="header-main">
      {header.map((item, index) => (
        <Button
          sx={{ fontSize: "10px" }}
          color="secondary"
          onClick={() => {
            setSelected(item?.title);
            navigate(item?.to);
          }}
          key={index}
          variant={item.title === selected ? "contained" : "outlined"}
        >
          {item?.title}
        </Button>
      ))}
    </div>
  );
};

export default Header;
