/**
 * Table — Tabla reutilizable basada en una definición de columnas.
 *
 * Props:
 *  - columns: [{ key, header, render?(row), className? }]
 *  - data: array de filas
 *  - emptyText: texto cuando no hay datos
 *  - rowKey: función que devuelve la clave única de cada fila
 */
export default function Table({ columns, data, emptyText = 'Sin registros para mostrar.', rowKey }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left font-semibold text-subtle text-xs uppercase
                  tracking-wide px-4 py-3 whitespace-nowrap ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-10">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row) : i}
                className="border-b border-edge/70 last:border-0 hover:bg-canvas/60 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-ink ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
