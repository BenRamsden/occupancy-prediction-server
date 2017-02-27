Open iptables firewall port 3306

	iptables -A INPUT -i eth0 -p tcp -m tcp --dport 3306 -j ACCEPT

Open ufw firewall port 3306

	sudo ufw allow 3306/tcp
	sudo service ufw restart

Add to /etc/mysql/my.cnf

	bind-address=0.0.0.0

Call in linux

	sudo service mysql restart
	OR
	sudo /etc/init.d/mysql restart

In SQL

	GRANT ALL ON *.* to 'navigation_remote'@'%' IDENTIFIED BY 'gibsonXC40_99546';

	FLUSH PRIVILEGES;

