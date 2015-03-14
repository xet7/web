import os, random, string
from fabric.api import run, env, cd, settings, put, local, shell_env

# load ~/.ssh/id_rsa
env.key_filename = os.getenv('HOME', '/root') + '/.ssh/id_rsa'

# determine hosts
branch = os.getenv('DRONE_BRANCH', '')
if branch == "master":
	env.hosts = ["marge.lavaboom.io:36104"]
	api_uri = "https://api.lavaboom.com"
	tld = "lavaboom.com"
elif branch == "staging":
	env.hosts = ["lisa.lavaboom.io:36412"]
	api_uri = "https://api.lavaboom.io"
	tld = "lavaboom.io"
elif branch == "develop":
	env.hosts = ["bart.lavaboom.io:36467"]
	api_uri = "https://api.lavaboom.co"
	tld = "lavaboom.co"

# build
def build():
	# we install required npm packages with increased number of retries and if it fails we use backup mirror
	local("npm install --fetch-retries 3 -g gulp || npm install --fetch-retries 3 --registry http://registry.npmjs.eu -g gulp")
	local("npm install --fetch-retries 3 || npm install --fetch-retries 3 --registry http://registry.npmjs.eu")
	if branch == "master" or branch == "staging":
		with shell_env(API_URI=api_uri, TLD=tld):
			local("gulp production")
	elif branch == "develop":
		with shell_env(API_URI=api_uri, TLD=tld):
			local("gulp develop")
	else:
		local("gulp develop")

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
		put('website.conf', tmp_dir + '/web/website.conf')

		with cd('web'):
			run('tar -xzvf dist.tgz')
			run('docker build -t registry.lavaboom.io/lavaboom/web-' + branch + ' .')

		run('git clone git@github.com:lavab/docker.git')
		with settings(warn_only=True):
			run('docker rm -f web-' + branch)
		with cd('docker/runners'):
			run('./web-' + branch + '.sh')

	run('rm -r ' + tmp_dir)

def integrate():
	build()

	if branch == "master" or branch == "staging" or branch == "develop":
		deploy()