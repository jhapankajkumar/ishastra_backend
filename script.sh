source ~/.bash_profile
pm2 kill
git pull
pm2 start npm --name ishastra_backend -- start