import { TextField, Button, Banner } from "@shopify/polaris";
import { useState } from "react";

const ListCreator = () => {
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);

  const handleCreate = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/gift_lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, customer_email: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.join(", ") || data.message);
      setMessage({ status: "success", text: `Creata lista con url ${data.public_url}` });
    } catch (err) {
      setMessage({ status: "critical", text: err.message });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {message && <Banner status={message.status}>{message.text}</Banner>}
      <TextField label="Titolo" value={title} onChange={setTitle} />
      <TextField label="Email cliente" value={email} onChange={setEmail} type="email" />
      <Button primary onClick={handleCreate}>
        Crea lista
      </Button>
    </div>
  );
};

export default ListCreator;

