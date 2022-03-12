// shipitfile.js

// Ejemplo de comando
// npx shipit staging deploy --name=athoz-backend --type=react --repo=git@github.com:htorohn/athoz-backend.git --branch=main --server=deploy@e8cb74f.online-server.cloud

module.exports = (shipit) => {
	// Load shipit-deploy tasks
	require('shipit-deploy')(shipit)
	require('shipit-shared')(shipit)
	const parseArg = require('./parseArgs')
	const params = parseArg(process.argv)

	console.log('params: ', params)

	if (!params.type) {
		console.log('ESPECIFY TYPE <react  || node>')
		process.exit()
	}

	switch (params.type) {
		case 'react': {
			shipit.initConfig({
				default: {
					deployTo: `/var/www/${params.name}`,
					workspace: params.workspace,
					// '/Users/htoro/Documents/Desarrollo/Negocio/athoz.io/athoz-frontend/',
					dirToCopy: './build/',
					keppWorkspace: true,
					keepReleases: 3,
					shallowClone: false,
					branch: params.branch, //'main',
				},
				staging: {
					servers: params.server, //'deploy@e8cb74f.online-server.cloud',
				},
			})

			// //reiniciamos el proceso para que tome la nueva version
			shipit.blTask('server:restart', async () => {
				// const command = 'forever restartall'
				// await shipit.remote(`cd ${shipit.config.deployTo} && ${command}`)
				await shipit.remote(`pm2 restart ${params.name}`)
			})

			shipit.on('published', () => {
				shipit.start('server:restart')
			})
			return
		}
		case 'node': {
			shipit.initConfig({
				default: {
					deployTo: `/var/www/${params.name}`,
					repositoryUrl: params.repo, //'git@github.com:htorohn/athoz-backend.git',
					branch: params.branch, //'main',
					keepReleases: 3,
					shared: {
						dirs: ['node_modules'],
						overwrite: true,
					},
				},
				staging: {
					servers: params.server, //'deploy@e8cb74f.online-server.cloud',
				},
			})

			//hacemos el install de los modulos del proyecto
			shipit.blTask('npm:install', async () => {
				await shipit.remote(
					`cd ${shipit.releasePath} && npm install --production`
				)
			})

			//reiniciamos el proceso para que tome la nueva version
			shipit.blTask('server:restart', async () => {
				// const command = 'forever restartall'
				// await shipit.remote(`cd ${shipit.config.deployTo} && ${command}`)
				await shipit.remote(`pm2 restart ${params.name}`)
			})

			shipit.on('updated', () => {
				shipit.start('npm:install')
			})

			shipit.on('published', () => {
				shipit.start('server:restart')
			})
			return
		}
		default:
			process.exit()
	}
}