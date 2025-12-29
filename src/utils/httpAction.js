import toast from "react-hot-toast";

const httpAction = async (data) => {
  try {
    const reponse = await fetch(data.url, {
      method: data.method ? data.method : "GET",
      body: data.body ? JSON.stringify(data.body) : null,
      headers: { "Content-Type": "application/json" },
    });
    const result = await reponse.json();
    if (!reponse.ok) {
      throw new Error(result?.message);
    }
    return result;
  } catch (error) {
    console.log(error.message);
    toast.error(error.message)
}
};

export default httpAction;
