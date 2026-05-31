export default function Button({ text }) {
  return (
    <button onClick={() => alert(text)}>
      {text}
    </button>
  );
}
