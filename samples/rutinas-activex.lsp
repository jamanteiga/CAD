;;; rutinas-activex.lsp — rutinas Visual LISP (vla-*/vlax-*) estándar, sin adaptar
;;; Cargar con APPLOAD o arrastrando el archivo a la ventana.
(vl-load-com)

;; LONGTOTAL: longitud total de las curvas seleccionadas (vlax-curve)
(defun c:longtotal (/ ss i e tot)
  (if (setq ss (ssget '((0 . "LINE,ARC,CIRCLE,LWPOLYLINE,ELLIPSE,SPLINE"))))
    (progn
      (setq tot 0.0 i 0)
      (repeat (sslength ss)
        (setq e (ssname ss i) i (1+ i)
              tot (+ tot (vlax-curve-getdistatparam e (vlax-curve-getendparam e)))))
      (princ (strcat "\nLongitud total de " (itoa (sslength ss)) " objetos: " (rtos tot 2 3)))))
  (princ))

;; ALTURATEXTO: cambia la altura de todos los textos del dibujo, también dentro de los bloques
(defun c:alturatexto (/ doc h n)
  (setq doc (vla-get-activedocument (vlax-get-acad-object)) n 0)
  (initget 6)
  (if (setq h (getdist "\nNueva altura de texto: "))
    (progn
      (vla-startundomark doc)
      (vlax-for blk (vla-get-blocks doc)
        (vlax-for obj blk
          (if (wcmatch (vla-get-objectname obj) "AcDbText,AcDbMText,AcDbAttributeDefinition")
            (progn (vla-put-height obj h) (setq n (1+ n))))))
      (vla-endundomark doc)
      (vla-regen doc acAllViewports)
      (princ (strcat "\n" (itoa n) " textos modificados."))))
  (princ))

;; NUMERAR: numera correlativamente el atributo indicado en los bloques seleccionados
(defun c:numerar (/ ss tag n i blk)
  (setq tag (strcase (getstring "\nEtiqueta del atributo <NUM>: ")))
  (if (= tag "") (setq tag "NUM"))
  (setq n (getint "\nNúmero inicial <1>: "))
  (if (not n) (setq n 1))
  (if (setq ss (ssget '((0 . "INSERT") (66 . 1))))
    (progn
      (setq i 0)
      (repeat (sslength ss)
        (setq blk (vlax-ename->vla-object (ssname ss i)) i (1+ i))
        (foreach att (vlax-invoke blk 'GetAttributes)
          (if (= (strcase (vla-get-tagstring att)) tag)
            (progn (vla-put-textstring att (itoa n)) (setq n (1+ n))))))))
  (princ))

;; INFOCAPAS: lista las capas con su estado y el número de objetos de cada una
(defun c:infocapas (/ doc lst)
  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vlax-for lay (vla-get-layers doc)
    (setq lst (cons (list (vla-get-name lay) 0 (vla-get-layeron lay) (vla-get-freeze lay)) lst)))
  (vlax-for obj (vla-get-modelspace doc)
    (setq lst (mapcar '(lambda (x) (if (= (car x) (vla-get-layer obj)) (list (car x) (1+ (cadr x)) (caddr x) (cadddr x)) x)) lst)))
  (textscr)
  (foreach x (vl-sort lst '(lambda (a b) (< (car a) (car b))))
    (princ (strcat "\n" (car x) ": " (itoa (cadr x)) " objetos"
                   (if (= (caddr x) :vlax-false) ", desactivada" "")
                   (if (= (cadddr x) :vlax-true) ", inutilizada" ""))))
  (princ))

(princ "\nRutinas ActiveX: LONGTOTAL, ALTURATEXTO, NUMERAR, INFOCAPAS.")
(princ)
