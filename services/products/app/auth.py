from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from .config import settings

# El token se obtiene del login del servicio de usuarios (a través del gateway)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


def get_current_user_email(token: str = Depends(oauth2_scheme)) -> str:
    """Valida el JWT (firmado por el servicio de usuarios) y devuelve el email."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email = payload.get("sub")
        if not email:
            raise JWTError()
        return email
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o ausente")
