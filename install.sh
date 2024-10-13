#!/bin/bash

if (( $EUID != 0 )); then
    echo "Please run as root"
    exit
fi

clear

installTheme(){
    cd /var/www/
    tar -cvf ZuesTheme.tar.gz pterodactyl
    echo "Installing theme..."
    cd /var/www/pterodactyl
    rm -r ZuesTheme
    git clone https://github.com/Zerodactyle/ZuesTheme.git
    cd ZuesTheme
    rm /var/www/pterodactyl/resources/scripts/ZuesTheme.css
    rm /var/www/pterodactyl/resources/scripts/index.tsx
    rm /var/www/pterodactyl/resources/scripts/components/server/console/Console.tsx
    mv resources/scripts/index.tsx /var/www/pterodactyl/resources/scripts/index.tsx
    mv resources/scripts/ZuesTheme.css /var/www/pterodactyl/resources/scripts/ZuesTheme.css
    mv resources/scripts/components/server/console/Console.tsx /var/www/pterodactyl/resources/scripts/components/server/console/Console.tsx
    cd /var/www/pterodactyl

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | sudo -E bash -
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    nvm install node || {
        echo "nvm command not found, trying to source nvm script directly..."
        . ~/.nvm/nvm.sh
        nvm install node
    }
    apt update

    npm i -g yarn
    yarn
    export NODE_OPTIONS=--openssl-legacy-provider
    yarn build:production || {
        echo "node: --openssl-legacy-provider is not allowed in NODE_OPTIONS"
        export NODE_OPTIONS=
        yarn build:production
    }
    sudo php artisan optimize:clear
}

installThemeQuestion(){
    while true; do
        read -p "Are you sure that you want to install the theme [y/N]? " yn
        case $yn in
            [Yy]* ) installTheme; break;;
            [Nn]* ) exit;;
            * ) exit;;
        esac
    done
}

repair(){
    bash <(curl https://raw.githubusercontent.com/Zerodactyle/ZuesTheme/main/repair.sh)
}

restoreBackUp(){
    echo "Restoring backup..."
    cd /var/www/
    tar -xvf ZuesTheme.tar.gz
    rm ZuesTheme.tar.gz

    cd /var/www/pterodactyl
    yarn build:production
    sudo php artisan optimize:clear
}

echo ""
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                                                                                          "
echo "                                                 _______                                                                  "
echo "                                                /       \                                                                 "
echo "                                               /         \                                                                "
echo "                                              /           \                                                               "
echo "                                             /             \                                                              "
echo "                                            /               \                                                             "
echo "                                           /                 \                                                            "
echo "                                          /                   \                                                           "
echo "                                         /                     \                                                          "
echo "                                        /                       \                                                         "
echo "                                       /                         \                                                        "
echo "                                      /                           \                                                       "
echo "                                     /                             \                                                      "
echo "                                    /                               \                                                     "
echo "                                   /                                 \                                                    "
echo "                                  /                                   \                                                   "
echo "                                 /                                     \                                                  "
echo "                                /                                       \                                                 "
echo "                               /                                         \                                                "
echo "                              /                                           \                                               "
echo "                             /                                             \                                              "
echo "                            /                                               \                                             "
echo "                           /                                                 \                                            "
echo "                          /                                                   \                                           "
echo "                         /                                                     \                                          "
echo "                        /                                                       \                                         "
echo "                       /                                                         \                                        "
echo "                      /                                                           \                                       "
echo "                     /                                                             \                                      "
echo "                    /                                                               \                                     "
echo "                   /                                                                 \                                    "
echo "                  /                                                                   \                                   "
echo "                 /                                                                     \                                  "
echo "                /                                                                       \                                 "
echo "               /                                                                         \                                "
echo "              /                                                                           \                               "
echo "             /                                                                             \                              "
echo "            /                                                                               \                             "
echo "           /                                                                                 \                            "
echo "          /                                                                                   \                           "
echo "         /                                                                                     \                          "
echo "        /                                                                                       \                         "
echo "       /                                                                                         \                        "
echo "      /                                                                                           \                       "
echo "     /                                                                                             \                      "
echo "    /                                                                                               \                     "
echo "   /                                                                                                 \                    "
echo "  /                                                                                                   \                   "
echo " /                                                                                                     \                  "
echo "/                                                                                                       \                 "
echo "Copyright (c) 2024 Zexo | Zexo"
echo "This program is free software: you can use it"
echo ""
echo ""
echo "[1] Install theme"
echo "[2] Restore backup"
echo "[3] Repair panel (use if you have an error in the theme installation)"
echo "[4] Update the panel"
echo "[5] Exit"

read -p "Please enter a number: " choice
if [ $choice == "1" ]
    then
    installThemeQuestion
fi
if [ $choice == "2" ]
    then
    restoreBackUp
fi
if [ $choice == "3" ]
    then
    repair
fi
if [ $choice == "4" ]
    then
    repair
fi
if [ $choice == "5" ]
    then
    exit
fi
