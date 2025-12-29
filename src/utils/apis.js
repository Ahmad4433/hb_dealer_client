const apis = () => {
  const local = "http://localhost:5050/";
  const live = 'https://studentportal.hafizbrothersestate.com/'

  const list = {
    addUser: `${live}user/add`,
    addInvoice: `${live}user/invoice/add`,
    userList: `${live}user/list`,
    invoiceList: `${live}user/invoice/list`,
    getSingleUser:`${live}user/single`,
    updateUser:`${live}user/update`
  };

  return list;
};

export default apis;
