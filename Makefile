.PHONY: up down build test logs clean

up:            ## Levantar todo el stack
	docker compose up -d --build

down:          ## Parar y eliminar contenedores
	docker compose down

build:         ## Construir imágenes
	docker compose build

logs:          ## Ver logs en vivo
	docker compose logs -f

test:          ## Ejecutar tests de los 3 servicios en local
	cd services/users && pytest -q && cd ../..
	cd services/products && pytest -q && cd ../..
	cd services/orders && pytest -q && cd ../..

clean:         ## Parar y borrar volúmenes (¡borra los datos!)
	docker compose down -v
