import { useSearchParams, Link } from 'react-router-dom'

export default function CheckoutResultPage({ type }) {
  const [params] = useSearchParams()
  const order = params.get('order') || params.get('external_reference')

  const messages = {
    sucesso: { title: 'Pagamento aprovado!', desc: 'Seu pedido foi confirmado com sucesso.' },
    pendente: { title: 'Pagamento pendente', desc: 'Aguardando confirmação do pagamento.' },
    falha: { title: 'Pagamento não concluído', desc: 'Houve um problema com o pagamento. Tente novamente.' },
  }

  const msg = messages[type] || messages.sucesso

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-3xl font-bold">{msg.title}</h1>
      <p className="mt-4 text-brand-muted">{msg.desc}</p>
      {order && <p className="mt-2 text-sm">Pedido: <strong>{order}</strong></p>}
      <Link to="/" className="btn-primary mt-8 inline-block">Voltar à loja</Link>
    </div>
  )
}
