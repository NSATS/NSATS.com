#!/bin/bash

while true;
do
    echo "<html>" > page.html
    echo "<meta http-equiv="refresh" content="1">" >> page.html
    echo "<body>" >> page.html
        _genuid=$(date '+%d/%m/%Y %H:%M:%S')
        echo "<br><b>Generated on: </b>${_genuid} (hh:min:sec)<br>"  >> page.html
        echo "<u>NSATS Ref:</u> AAR Live Feed<br>"  >> page.html
        echo "<u>File Sz:</u> 6 - 9 M<br><br><br>"  >> page.html
        echo "<table style="width:90%" border="1" cellspacing="0">" >> page.html
            # echo "<b>QUANTUM COMPRESSION RESULTS</b>"  >> page.html
            # echo "<br><br>" >> page.html
            echo "<tr>" >> page.html
                echo "<td><b>S.No.</b></td>" >> page.html
                echo "<td><b>Filename (hash)</b></td>" >> page.html
                echo "<td><b>Input Size</b></td>" >> page.html
                echo "<td><b>Output Size</b></td>" >> page.html
            echo "</tr>" >> page.html
            for i in {1..500}
            do

                ########### ROW START
                echo "<tr>" >> page.html

                    echo "<td>${i}</td>" >> page.html
                    array=()
                    for i in {A..Z} {0..9}; 
                    # for i in {a..z} {A..Z} {0..9}; 
                    do
                        array[$RANDOM]=$i
                    done
                    _hash=$(printf %s 0x${array[@]::12}) # $'\n'
                    echo "<td>${_hash}</td>" >> page.html

                    array=()
                    for i in {6..9}; 
                    # for i in {a..z} {A..Z} {0..9}; 
                    do
                        array[$RANDOM]=$i
                    done
                    _input=$(printf %s ${array[@]::4})Kb # $'\n'
                    echo " <td>${_input}</td>" >> page.html

                    array=()
                    for i in {1..5}; 
                    # for i in {a..z} {A..Z} {0..9}; 
                    do
                        array[$RANDOM]=$i
                    done
                    _output=$(printf %s ${array[@]::4})Kb # $'\n'
                    echo " <td>${_output}</td>" >> page.html
                echo " </tr>" >> page.html
                ########### ROW END
            done       

        

        echo " </table>" >> page.html
    
    # echo "<br><br>" >> page.html
    
    # echo "Copyright NSATS 2024"  >> page.html
    echo "</body>" >> page.html
sleep 5m
done
