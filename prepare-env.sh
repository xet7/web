export GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$GIT_BRANCH" = "staging" ]
then
	export API_URI=https://api.lavaboom.io
	export ROOT_DOMAIN=lavaboom.io
elif [ "$GIT_BRANCH" = "develop" ]
then
	export API_URI=https://api.lavaboom.co
	export ROOT_DOMAIN=lavaboom.co
fi
