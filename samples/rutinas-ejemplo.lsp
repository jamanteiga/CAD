;;; rutinas-ejemplo.lsp — rutinas AutoLISP de prueba para WebCAD
;;; Cargar con APPLOAD o arrastrando el archivo a la ventana.

;; BRIDA: brida con N taladros
(defun c:brida (/ c re n rb a i)
  (setq c (getpoint "\nCentro de la brida: "))
  (setq re (getdist c "\nRadio exterior <100>: "))
  (if (not re) (setq re 100.0))
  (initget 6)
  (setq n (getint "\nNúmero de taladros <8>: "))
  (if (not n) (setq n 8))
  (setq rb (* re 0.75) i 0)
  (command "_.circle" c re)
  (command "_.circle" c (* re 0.45))
  (repeat n
    (setq a (/ (* 2 pi i) n))
    (command "_.circle" (polar c a rb) (* re 0.07))
    (setq i (1+ i)))
  (princ (strcat "\nBrida con " (itoa n) " taladros."))
  (princ))

;; CAPAS: crea un juego de capas típico
(defun c:capas ()
  (foreach l '(("EJES" 1 "CENTER") ("CONTORNO" 7 "CONTINUOUS") ("OCULTAS" 8 "HIDDEN") ("COTAS" 3 "CONTINUOUS") ("TEXTOS" 2 "CONTINUOUS"))
    (command "_.-layer" "_m" (car l) "_c" (cadr l) "" "_l" (caddr l) "" ""))
  (setvar "CLAYER" "0")
  (princ "\nCapas creadas.")
  (princ))

;; LONG: suma la longitud de líneas, arcos y polilíneas seleccionadas
(defun c:long (/ ss i e tot)
  (setq ss (ssget '((0 . "LINE,ARC,LWPOLYLINE,CIRCLE"))) tot 0.0 i 0)
  (if ss
    (progn
      (repeat (sslength ss)
        (setq e (ssname ss i) tot (+ tot (vlax-curve-getdistatparam e (vlax-curve-getendparam e))) i (1+ i)))
      (princ (strcat "\nLongitud total: " (rtos tot 2 3) " en " (itoa (sslength ss)) " objetos."))))
  (princ))

;; CAMBIACAPA: pasa los objetos seleccionados a la capa de un objeto origen
(defun c:cambiacapa (/ src lay ss i ed)
  (setq src (car (entsel "\nObjeto con la capa destino: ")))
  (if src
    (progn
      (setq lay (cdr (assoc 8 (entget src))))
      (setq ss (ssget) i 0)
      (if ss (repeat (sslength ss)
               (setq ed (entget (ssname ss i)))
               (entmod (subst (cons 8 lay) (assoc 8 ed) ed))
               (setq i (1+ i))))
      (princ (strcat "\nCapa aplicada: " lay))))
  (princ))

(princ "\nComandos cargados: BRIDA, CAPAS, LONG, CAMBIACAPA")
(princ)
