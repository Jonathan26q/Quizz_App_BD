const oracledb = require('oracledb');

function oracle() {
  // Configuración de la conexión
  const dbConfig = {
    user: "SADMIN",
    password: "123",
    connectString: "localhost/XE"
  };

  // Función auxiliar para formatear consultas con bind values
  function formatQuery(query, binds) {
    let formattedQuery = query;
    for (let i = 0; i < binds.length; i++) {
      formattedQuery = formattedQuery.replace('?', `:${i + 1}`);
    }
    return { formattedQuery, binds };
  }

  async function executeQuery(query, binds = []) {
    let conn, result;
    const { formattedQuery, binds: formattedBinds } = formatQuery(query, binds);
  
    try {
		// Obtener una conexión global si no existe
		conn = await oracledb.getConnection(dbConfig);

		// Ejecutar la consulta SQL
		result = await conn.execute(formattedQuery, formattedBinds, { autoCommit: true });
    } catch (err) {
		console.error('Error al ejecutar la consulta:', err);
		await conn.close();
		throw err;
    }

    return result;
  }

  // Objeto SQL
  const sql = {
	prepare: (query) => {
		const prepared = {
		query,
		run: async (...binds) => {
			await executeQuery(prepared.query, binds);
		},
		get: async (...binds) => {
			const result = await executeQuery(prepared.query, binds);
			if (result.rows.length > 0) {
			const obj = {};
			for (let i = 0; i < result.metaData.length; i++) {
				obj[result.metaData[i].name.toLowerCase()] = result.rows[0][i];
			}
			return obj;
			}
			return null;
		},
		all: async (...binds) => {
			const result = await executeQuery(prepared.query, binds);
			return result.rows.map((row) => {
			const obj = {};
			for (let i = 0; i < result.metaData.length; i++) {
				obj[result.metaData[i].name.toLowerCase()] = row[i];
			}
			return obj;
			});
		}
		};

		return prepared;
	}
	};

	return sql;
}


module.exports = { oracle };