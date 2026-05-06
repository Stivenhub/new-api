package dto

type CreateOrganizationRequest struct {
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Status      *int   `json:"status"`
}

type UpdateOrganizationRequest struct {
	Id          int    `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Status      *int   `json:"status"`
}

type OrganizationUserRequest struct {
	UserIds []int `json:"user_ids"`
}
