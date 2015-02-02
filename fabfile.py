import os, random, string
from fabric.api import run, env, cd, settings, put, local

env.key_filename = os.getenv('HOME', '/root') + '/.ssh/id_rsa'

def deploy():
	branch = os.getenv('DRONE_BRANCH', 'master')
	commit = os.getenv('DRONE_COMMIT', 'master')
	tmp_dir = '/tmp/' + ''.join(random.choice(string.lowercase) for i in xrange(10))

	local('tar cvfz dist.tgz dist/')
	run('mkdir ' + tmp_dir)
	with cd(tmp_dir):
		run('mkdir -p ' + tmp_dir + '/web/dist')
		put('dist.tgz', tmp_dir + '/web/dist.tgz')
		put('Dockerfile', tmp_dir + '/web/Dockerfile')

		with cd('web'):
			run('tar -xzvf dist.tgz')
			run('docker build -t registry.lavaboom.io/lavaboom/web-' + branch + ' .')

		run('git clone git@github.com:lavab/docker.git')
		with settings(warn_only=True):
			run('docker rm -f web-' + branch)
		with cd('docker/runners'):
			run('./web-' + branch + '.sh')

	run('rm -r ' + tmp_dir)