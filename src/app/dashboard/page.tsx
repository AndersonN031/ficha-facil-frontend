"use client";

export default function DashboardTemplate() {
  const stats = [
    {
      title: "Usuários",
      value: "0",
      change: "+0%",
    },
    {
      title: "Vendas",
      value: "R$ 0,00",
      change: "+0%",
    },
    {
      title: "Pedidos",
      value: "0",
      change: "+0%",
    },
    {
      title: "Conversão",
      value: "0%",
      change: "+0%",
    },
  ];

  const recentActivities = [
    {
      title: "Exemplo de atividade",
      description: "Descrição da atividade aqui.",
      time: "Agora",
    },
    {
      title: "Outra atividade",
      description: "Você pode substituir isso facilmente.",
      time: "5 min atrás",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-zinc-400 mt-1">
              Template simples para você preencher.
            </p>
          </div>

          <button className="bg-white text-black px-5 py-2 rounded-2xl font-medium hover:opacity-90 transition">
            Ação
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((item) => (
            <div
              key={item.title}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">{item.title}</p>
                  <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
                </div>

                <span className="text-sm bg-zinc-800 px-3 py-1 rounded-full">
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart Placeholder */}
          <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Gráfico</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Coloque aqui gráficos, métricas ou tabelas.
                </p>
              </div>
            </div>

            <div className="h-[300px] rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500">
              Área do gráfico
            </div>
          </div>

          {/* Activity */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Atividades</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Atualizações recentes.
              </p>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="border border-zinc-800 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-zinc-400 text-sm mt-1">
                        {activity.description}
                      </p>
                    </div>

                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Placeholder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Tabela</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Substitua pelos seus dados.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="pb-4 font-medium">Nome</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Data</th>
                  <th className="pb-4 font-medium">Valor</th>
                </tr>
              </thead>

              <tbody>
                {[1, 2, 3, 4].map((item) => (
                  <tr key={item} className="border-b border-zinc-800/50">
                    <td className="py-4">Item {item}</td>
                    <td className="py-4">
                      <span className="bg-zinc-800 px-3 py-1 rounded-full text-sm">
                        Pendente
                      </span>
                    </td>
                    <td className="py-4">15/05/2026</td>
                    <td className="py-4">R$ 0,00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
