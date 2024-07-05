# docker exec
de:
	docker exec -it exeedme-app bash

# docker up build
dub:
	docker compose up -d --remove-orphans --build

# docker up 
du:
	docker compose up -d --remove-orphans

# docker down 
dd:
	docker compose down --remove-orphans 

# Pull latest commits and stash local changes commits
# gps:
# 	git stash --include-untracked && git pull -r && git stash pop

# Push to develop branch ("Pull 2 and push 4 commits between origin/develop")
# 	git pull origin develop 
#   solve all conflicts
# 	git add .
# 	git commit -m "Solve conflicts"
# 	git push origin develop
